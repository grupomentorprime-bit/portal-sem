import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityAuditEntry } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";

export async function writeAudit(input: {
  tenantId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<IdentityAuditEntry> {
  const db = await getDatabase();
  const entry: IdentityAuditEntry = {
    _id: generateId("audit"),
    tenantId: input.tenantId,
    userId: input.userId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };

  await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);
  return entry;
}

export async function listAuditByTenant(
  tenantId: string,
  limit = 50
): Promise<IdentityAuditEntry[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityAuditEntry>("identity_audit")
    .find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/** Eventos donde el usuario fue actor o fue afectado (cambios de rol, acceso, etc.). */
export async function listAuditForMember(
  tenantId: string,
  input: { userId: string; membershipId: string },
  limit = 40
): Promise<IdentityAuditEntry[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityAuditEntry>("identity_audit")
    .find({
      tenantId,
      $or: [
        { userId: input.userId },
        { "metadata.targetUserId": input.userId },
        { entity: "membership", entityId: input.membershipId },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
