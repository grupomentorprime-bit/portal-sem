import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, StudentAffairsScope } from "@/types/identity";
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

export async function countMembershipsByTenant(tenantId: string): Promise<number> {
  const db = await getDatabase();
  return db.collection<IdentityMembership>("identity_memberships").countDocuments({ tenantId });
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

export async function updateMembershipStudentAffairsScope(
  membershipId: string,
  scope: StudentAffairsScope
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<IdentityMembership>("identity_memberships").updateOne(
    { _id: membershipId },
    { $set: { studentAffairsScope: scope, updatedAt: now } }
  );
  return db.collection<IdentityMembership>("identity_memberships").findOne({ _id: membershipId });
}

export async function updateMembershipPermissionOverrides(
  membershipId: string,
  overrides: Record<string, boolean> | null
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (!overrides || Object.keys(overrides).length === 0) {
    await db.collection<IdentityMembership>("identity_memberships").updateOne(
      { _id: membershipId },
      { $unset: { permissionOverrides: "" }, $set: { updatedAt: now } }
    );
  } else {
    await db.collection<IdentityMembership>("identity_memberships").updateOne(
      { _id: membershipId },
      { $set: { permissionOverrides: overrides, updatedAt: now } }
    );
  }
  return db.collection<IdentityMembership>("identity_memberships").findOne({ _id: membershipId });
}

export async function clearMembershipPermissionOverrides(
  membershipId: string
): Promise<IdentityMembership | null> {
  return updateMembershipPermissionOverrides(membershipId, null);
}
