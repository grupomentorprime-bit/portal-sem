import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, IdentityUser } from "@/types/identity";
import {
  acceptInvitation,
  findPendingInvitationByEmail,
} from "@/lib/identity/invitations";
import { createMembership, findMembership } from "@/lib/identity/memberships";
import { ensureTenantRoles, getOwnerRole } from "@/lib/identity/roles";
import { createUser, findUserByEmail, upsertOidcCredential } from "@/lib/identity/users";
import type { KeycloakUserInfo } from "@/core/identity/auth/keycloak";

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
  tenantId: string
): Promise<IdentityUser> {
  const email = profile.email?.toLowerCase().trim();
  if (!email) {
    throw new Error("Keycloak no devolvió un correo válido.");
  }

  const invitation = await findPendingInvitationByEmail(tenantId, email);
  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser({
      email,
      displayName:
        invitation?.displayName?.trim() ||
        profile.name?.trim() ||
        profile.preferred_username ||
        email,
      emailVerified: profile.email_verified ?? false,
    });
  }

  await upsertOidcCredential({
    userId: user._id,
    providerUserId: profile.sub,
    providerData: {
      issuer: "keycloak",
      preferredUsername: profile.preferred_username,
    },
  });

  return user;
}

export async function resolveKeycloakMembership(
  user: IdentityUser,
  tenantId: string
): Promise<IdentityMembership | null> {
  const existing = await findMembership(user._id, tenantId);
  if (existing) return existing;

  const invitation = await findPendingInvitationByEmail(tenantId, user.email);
  if (invitation) {
    const membership = await createMembership({
      tenantId,
      userId: user._id,
      roleIds: invitation.roleIds,
      invitedBy: invitation.invitedBy,
    });
    await acceptInvitation(invitation._id, user._id);
    return membership;
  }

  const db = await getDatabase();
  const membershipCount = await db
    .collection<IdentityMembership>("identity_memberships")
    .countDocuments({ tenantId });

  if (membershipCount === 0) {
    await ensureTenantRoles(tenantId);
    const ownerRole = await getOwnerRole(tenantId);
    return createMembership({
      tenantId,
      userId: user._id,
      roleIds: ownerRole ? [ownerRole._id] : [],
    });
  }

  return null;
}

export async function finishKeycloakLogin(
  profile: KeycloakUserInfo,
  tenantId: string
): Promise<{ user: IdentityUser; membership: IdentityMembership }> {
  const user = await upsertUserFromKeycloak(profile, tenantId);
  const membership = await resolveKeycloakMembership(user, tenantId);

  if (!membership) {
    throw new KeycloakAccessError(
      "Tu cuenta no tiene acceso al CMS. Solicita una invitación al administrador.",
      "no_access"
    );
  }

  return { user, membership };
}
