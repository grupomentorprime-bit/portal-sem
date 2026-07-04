import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, IdentityUser } from "@/types/identity";
import {
  acceptInvitation,
  findPendingInvitationByEmail,
} from "@/lib/identity/invitations";
import {
  createMembership,
  findMembership,
  updateMembershipRoles,
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

export async function resolveKeycloakMembership(
  user: IdentityUser,
  tenantId: string,
  accessToken: string
): Promise<IdentityMembership | null> {
  const payload = decodeAccessTokenPayload(accessToken);
  const realmRoles = extractRealmRoles(payload);
  const keycloakRoleIds = await resolveCmsRoleIdsFromKeycloak(tenantId, realmRoles);

  const existing = await findMembership(user._id, tenantId);
  if (existing) {
    if (user.email.toLowerCase() === SUPER_ADMIN_BOOTSTRAP_EMAIL) {
      await ensureSuperAdminMembership(tenantId, user._id);
      return findMembership(user._id, tenantId);
    }
    if (keycloakRoleIds.length > 0) {
      const updated = await updateMembershipRoles(existing._id, keycloakRoleIds);
      return updated ?? existing;
    }
    return existing;
  }

  const invitation = await findPendingInvitationByEmail(tenantId, user.email);
  if (invitation) {
    const roleIds = keycloakRoleIds.length > 0 ? keycloakRoleIds : invitation.roleIds;
    const membership = await createMembership({
      tenantId,
      userId: user._id,
      roleIds,
      invitedBy: invitation.invitedBy,
    });
    await acceptInvitation(invitation._id, user._id);
    return membership;
  }

  if (keycloakRoleIds.length > 0) {
    return createMembership({
      tenantId,
      userId: user._id,
      roleIds: keycloakRoleIds,
    });
  }

  const db = await getDatabase();
  const membershipCount = await db
    .collection<IdentityMembership>("identity_memberships")
    .countDocuments({ tenantId });

  if (membershipCount === 0) {
    await ensureTenantRoles(tenantId);
    const superAdminRole = await getSuperAdminRole(tenantId);
    return createMembership({
      tenantId,
      userId: user._id,
      roleIds: superAdminRole ? [superAdminRole._id] : [],
    });
  }

  if (user.email.toLowerCase() === SUPER_ADMIN_BOOTSTRAP_EMAIL) {
    await ensureSuperAdminMembership(tenantId, user._id);
    return findMembership(user._id, tenantId);
  }

  return null;
}

export async function finishKeycloakLogin(
  profile: KeycloakUserInfo,
  tenantId: string,
  accessToken: string
): Promise<{ user: IdentityUser; membership: IdentityMembership }> {
  const user = await upsertUserFromKeycloak(profile, tenantId, accessToken);
  await ensureSuperAdminMembershipForEmail(user.email, tenantId, user._id);
  const membership = await resolveKeycloakMembership(user, tenantId, accessToken);

  if (!membership) {
    throw new KeycloakAccessError(
      "Tu cuenta no tiene acceso al CMS. Solicita una invitación al administrador.",
      "no_access"
    );
  }

  return { user, membership };
}
