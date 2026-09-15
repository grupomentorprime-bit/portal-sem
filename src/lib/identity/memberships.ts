import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, StudentAffairsScope } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";

export class MembershipConflictError extends Error {
  readonly code = "membership_conflict" as const;

  constructor(
    message = "Ya existe una membresía para este usuario en este Espacio."
  ) {
    super(message);
    this.name = "MembershipConflictError";
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}

/** Membresía activa (Espacio usable). */
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

/**
 * Lookup D3: cualquier status. 1 usuario + 1 Espacio = máximo 1 documento.
 */
export async function findMembershipAnyStatus(
  userId: string,
  tenantId: string
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  return db.collection<IdentityMembership>("identity_memberships").findOne({
    userId,
    tenantId,
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
    .find({ tenantId, status: { $in: ["active", "suspended", "archived"] } })
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

/**
 * Crea membership solo si no existe ninguna (cualquier status).
 * Ante carrera / índice único: relanza MembershipConflictError.
 */
export async function createMembership(input: {
  tenantId: string;
  userId: string;
  roleIds: string[];
  invitedBy?: string;
  status?: IdentityMembership["status"];
}): Promise<IdentityMembership> {
  const existing = await findMembershipAnyStatus(input.userId, input.tenantId);
  if (existing) {
    throw new MembershipConflictError();
  }

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

  try {
    await db.collection<IdentityMembership>("identity_memberships").insertOne(membership);
    return membership;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new MembershipConflictError();
    }
    throw error;
  }
}

/**
 * Aceptación / reinvitación (D3): reutiliza membership existente o crea una.
 * Nunca inserta un segundo documento para el mismo (userId, tenantId).
 */
export async function ensureActiveMembership(input: {
  tenantId: string;
  userId: string;
  roleIds: string[];
  invitedBy?: string;
}): Promise<{ membership: IdentityMembership; created: boolean; reactivated: boolean }> {
  const existing = await findMembershipAnyStatus(input.userId, input.tenantId);
  if (existing) {
    const now = new Date().toISOString();
    const wasInactive = existing.status !== "active";
    const db = await getDatabase();
    await db.collection<IdentityMembership>("identity_memberships").updateOne(
      { _id: existing._id },
      {
        $set: {
          status: "active",
          roleIds: input.roleIds,
          ...(input.invitedBy ? { invitedBy: input.invitedBy } : {}),
          updatedAt: now,
        },
      }
    );
    const updated = await findMembershipById(existing._id);
    return {
      membership: updated ?? { ...existing, status: "active", roleIds: input.roleIds, updatedAt: now },
      created: false,
      reactivated: wasInactive,
    };
  }

  try {
    const membership = await createMembership({
      tenantId: input.tenantId,
      userId: input.userId,
      roleIds: input.roleIds,
      invitedBy: input.invitedBy,
      status: "active",
    });
    return { membership, created: true, reactivated: false };
  } catch (error) {
    if (error instanceof MembershipConflictError) {
      const raced = await findMembershipAnyStatus(input.userId, input.tenantId);
      if (raced) {
        return ensureActiveMembership(input);
      }
    }
    throw error;
  }
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

export async function updateMembershipStatus(
  membershipId: string,
  status: IdentityMembership["status"]
): Promise<IdentityMembership | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<IdentityMembership>("identity_memberships").updateOne(
    { _id: membershipId },
    { $set: { status, updatedAt: now } }
  );
  return findMembershipById(membershipId);
}

export async function deleteMembership(membershipId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<IdentityMembership>("identity_memberships").deleteOne({
    _id: membershipId,
  });
  return result.deletedCount > 0;
}

/**
 * Quitar acceso de este Espacio (D2): archiva la membership del tenant.
 * No toca user.status ni otras memberships.
 */
export async function archiveMembershipAccess(
  membershipId: string
): Promise<IdentityMembership | null> {
  return updateMembershipStatus(membershipId, "archived");
}
