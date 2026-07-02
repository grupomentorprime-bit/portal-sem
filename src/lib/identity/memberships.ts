import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";

export async function findMembership(
  userId: string,
  tenantId: string
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  return db.collection<IdentityMembership>("identity_memberships").findOne({
    userId,
    tenantId,
    status: "active",
  });
}

export async function listMembershipsByTenant(
  tenantId: string
): Promise<IdentityMembership[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityMembership>("identity_memberships")
    .find({ tenantId })
    .sort({ joinedAt: -1 })
    .toArray();
}

export async function listMembershipsByUser(
  userId: string
): Promise<IdentityMembership[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityMembership>("identity_memberships")
    .find({ userId, status: "active" })
    .toArray();
}

export async function createMembership(input: {
  tenantId: string;
  userId: string;
  roleIds: string[];
  invitedBy?: string;
  status?: IdentityMembership["status"];
}): Promise<IdentityMembership> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const membership: IdentityMembership = {
    _id: generateId("mem"),
    tenantId: input.tenantId,
    userId: input.userId,
    roleIds: input.roleIds,
    status: input.status ?? "active",
    joinedAt: now,
    invitedBy: input.invitedBy,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<IdentityMembership>("identity_memberships").insertOne(membership);
  return membership;
}

export async function findMembershipById(
  membershipId: string
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  return db.collection<IdentityMembership>("identity_memberships").findOne({ _id: membershipId });
}

export async function updateMembershipRoles(
  membershipId: string,
  roleIds: string[]
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<IdentityMembership>("identity_memberships").updateOne(
    { _id: membershipId },
    { $set: { roleIds, updatedAt: now } }
  );
  return db.collection<IdentityMembership>("identity_memberships").findOne({ _id: membershipId });
}
