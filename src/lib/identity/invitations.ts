import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityInvitation } from "@/types/identity";
import { generateId, generateToken } from "@/core/identity/auth/crypto";
import { normalizeEmail } from "@/lib/validation/identity";

const INVITATION_TTL_MINUTES = 15;

export async function createInvitation(input: {
  tenantId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  invitedBy: string;
  expiresInMinutes?: number;
}): Promise<IdentityInvitation> {
  const db = await getDatabase();
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  const existingPending = await findPendingInvitationByEmail(input.tenantId, email);
  if (existingPending) {
    throw new Error("Ya existe una invitación pendiente para este correo.");
  }

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + (input.expiresInMinutes ?? INVITATION_TTL_MINUTES));

  const invitation: IdentityInvitation = {
    _id: generateId("inv"),
    tenantId: input.tenantId,
    email,
    displayName,
    roleIds: input.roleIds,
    token: generateToken(24),
    status: "pending",
    invitedBy: input.invitedBy,
    expiresAt: expires.toISOString(),
    createdAt: now,
  };

  await db.collection<IdentityInvitation>("identity_invitations").insertOne(invitation);
  return invitation;
}

export async function findPendingInvitationByEmail(
  tenantId: string,
  email: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  return db.collection<IdentityInvitation>("identity_invitations").findOne({
    tenantId,
    email: normalizeEmail(email),
    status: "pending",
    expiresAt: { $gt: new Date().toISOString() },
  });
}

export async function listInvitationsByTenant(
  tenantId: string
): Promise<IdentityInvitation[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityInvitation>("identity_invitations")
    .find({ tenantId, status: "pending" })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findInvitationByToken(
  token: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  return db.collection<IdentityInvitation>("identity_invitations").findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date().toISOString() },
  });
}

export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityInvitation>("identity_invitations").updateOne(
    { _id: invitationId },
    {
      $set: {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        acceptedBy: userId,
      },
    }
  );
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityInvitation>("identity_invitations").updateOne(
    { _id: invitationId },
    { $set: { status: "revoked" } }
  );
}
