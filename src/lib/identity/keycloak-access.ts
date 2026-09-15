import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, IdentityUser } from "@/types/identity";
import {
  acceptInvitation,
  findPendingInvitationByEmail,
} from "@/lib/identity/invitations";
import {
  createMembership,
  ensureActiveMembership,
  findMembership,
  findMembershipAnyStatus,
  MembershipConflictError,
} from "@/lib/identity/memberships";
import { ensureTenantRoles, getSuperAdminRole, ensureSuperAdminMembership } from "@/lib/identity/roles";
import {
  ensureSuperAdminMembershipForEmail,
  SUPER_ADMIN_BOOTSTRAP_EMAIL,
} from "@/lib/identity/iam-guard";
import {
  createUser,
  findUserByEmail,
  updateUserProfile,
  upsertOidcCredential,
} from "@/lib/identity/users";
import type { KeycloakUserInfo } from "@/core/identity/auth/keycloak";
import {
  buildKeycloakIdentityClaims,
  decodeAccessTokenPayload,
  extractRealmRoles,
  resolveCmsRoleIdsFromKeycloak,
} from "@/lib/identity/keycloak-profile";

export class KeycloakAccessError extends Error {
  constructor(
    message: string,
    readonly code: "no_access" | "email"
  ) {
    super(message);
    this.name = "KeycloakAccessError";
  }
}

export async function upsertUserFromKeycloak(
  profile: KeycloakUserInfo,
  tenantId: string,
  accessToken: string
): Promise<IdentityUser> {
  const email = profile.email?.toLowerCase().trim();
  if (!email) {
    throw new Error("El servidor de identidad no devolvió un correo válido.");
  }

  const claims = buildKeycloakIdentityClaims(profile, accessToken);
  const invitation = await findPendingInvitationByEmail(tenantId, email);
  let user = await findUserByEmail(email);

  const displayName =
    claims.displayName ||
    invitation?.displayName?.trim() ||
    email;

  if (!user) {
    user = await createUser({
      email,
      displayName,
      emailVerified: profile.email_verified ?? false,
    });
  } else {
    user =
      (await updateUserProfile(user._id, {
        displayName,
        jobTitle: claims.jobTitle,
      })) ?? user;
  }

  await upsertOidcCredential({
    userId: user._id,
    providerUserId: profile.sub,
    providerData: {
      issuer: "keycloak",
      preferredUsername: profile.preferred_username,
      realmRoles: claims.realmRoles,
      jobTitle: claims.jobTitle,
    },
  });

  return user;
}

/**
 * D1 — Keycloak autentica; Mongo (`identity_memberships.roleIds`) es SSOT del rol por Espacio.
 * Login NO sobrescribe roleIds de membership existente; realm roles NO elevan membresías ya creadas.
 * Bootstrap/provision de cuentas o Espacios nuevos se preserva.
 */
export async function resolveKeycloakMembership(
  user: IdentityUser,
  tenantId: string,
  accessToken: string
): Promise<IdentityMembership | null> {
  const payload = decodeAccessTokenPayload(accessToken);
  const realmRoles = extractRealmRoles(payload);
  const keycloakRoleIds = await resolveCmsRoleIdsFromKeycloak(tenantId, realmRoles);

  const existingAny = await findMembershipAnyStatus(user._id, tenantId);
  if (existingAny) {
    if (user.email.toLowerCase() === SUPER_ADMIN_BOOTSTRAP_EMAIL) {
      await ensureSuperAdminMembership(tenantId, user._id);
      return findMembership(user._id, tenantId);
    }

    const invitation = await findPendingInvitationByEmail(tenantId, user.email);
    if (invitation && existingAny.status !== "active") {
      // Reinvitación: reactivar sobre la membership existente (D3). Rol desde invitación, no realm.
      const { membership } = await ensureActiveMembership({
        tenantId,
        userId: user._id,
        roleIds: invitation.roleIds,
        invitedBy: invitation.invitedBy,
      });
      await acceptInvitation(invitation._id, user._id, invitation.tenantId);
      return membership;
    }

    // Membership existente (active u otra): no pisar roleIds con realm roles.
    if (existingAny.status === "active") {
      return existingAny;
    }
    return null;
  }

  const invitation = await findPendingInvitationByEmail(tenantId, user.email);
  if (invitation) {
    // Alta nueva: invitación manda; realm roles no sustituyen el rol invitado.
    const { membership } = await ensureActiveMembership({
      tenantId,
      userId: user._id,
      roleIds: invitation.roleIds,
      invitedBy: invitation.invitedBy,
    });
    await acceptInvitation(invitation._id, user._id, invitation.tenantId);
    return membership;
  }

  if (keycloakRoleIds.length > 0) {
    // Solo provision de primera membership (sin documento previo).
    try {
      return await createMembership({
        tenantId,
        userId: user._id,
        roleIds: keycloakRoleIds,
      });
    } catch (error) {
      if (error instanceof MembershipConflictError) {
        return findMembership(user._id, tenantId);
      }
      throw error;
    }
  }

  const db = await getDatabase();
  const membershipCount = await db
    .collection<IdentityMembership>("identity_memberships")
    .countDocuments({ tenantId });

  if (membershipCount === 0) {
    await ensureTenantRoles(tenantId);
    const superAdminRole = await getSuperAdminRole(tenantId);
    try {
      return await createMembership({
        tenantId,
        userId: user._id,
        roleIds: superAdminRole ? [superAdminRole._id] : [],
      });
    } catch (error) {
      if (error instanceof MembershipConflictError) {
        return findMembership(user._id, tenantId);
      }
      throw error;
    }
  }

  if (user.email.toLowerCase() === SUPER_ADMIN_BOOTSTRAP_EMAIL) {
    await ensureSuperAdminMembership(tenantId, user._id);
    return findMembership(user._id, tenantId);
  }

  return null;
}

/**
 * Keycloak = identidad global. Membresías viven en Mongo (ADR-008 D6).
 * `preferredTenantId` (host) solo bootstrap/invitación; el Espacio activo
 * se elige entre todas las membresías activas de la cuenta.
 */
export async function finishKeycloakLogin(
  profile: KeycloakUserInfo,
  preferredTenantId: string | null,
  accessToken: string
): Promise<{
  user: IdentityUser;
  membership: IdentityMembership | null;
  activeTenantId: string | null;
}> {
  const preferred = preferredTenantId?.trim() || null;
  const user = await upsertUserFromKeycloak(
    profile,
    preferred ?? "platform",
    accessToken
  );

  if (preferred) {
    await ensureSuperAdminMembershipForEmail(user.email, preferred, user._id);
    await resolveKeycloakMembership(user, preferred, accessToken);
  }

  const { resolveActiveTenantForUser } = await import("@/lib/identity/active-space");
  const resolved = await resolveActiveTenantForUser(user._id, preferred);

  return {
    user,
    membership: resolved.membership,
    activeTenantId: resolved.activeTenantId,
  };
}
