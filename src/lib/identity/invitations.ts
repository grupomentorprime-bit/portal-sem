import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityInvitation } from "@/types/identity";
import { generateId, generateToken } from "@/core/identity/auth/crypto";

export async function createInvitation(input: {
  tenantId: string;
  email: string;
  roleIds: string[];
  invitedBy: string;
  expiresInDays?: number;
}): Promise<IdentityInvitation> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const expires = new Date();
  expires.setDate(expires.getDate() + (input.expiresInDays ?? 7));

  const invitation: IdentityInvitation = {
    _id: generateId("inv"),
    tenantId: input.tenantId,
    email: input.email.toLowerCase().trim(),
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
