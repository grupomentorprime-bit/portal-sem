import type { Db } from "mongodb";
import { normalizeEnabledAppIds } from "@/core/units/apps";
import {
  ORG_UNITS_COLLECTION,
  orgUnitDocumentId,
  type OrgUnit,
  type UnitKind,
  type UnitStatus,
} from "@/core/units/types";

export async function ensureOrgUnitIndexes(db: Db): Promise<void> {
  await db.collection(ORG_UNITS_COLLECTION).createIndex(
    { tenantId: 1, unitId: 1 },
    { unique: true }
  );
}

export async function listOrgUnits(db: Db, tenantId: string): Promise<OrgUnit[]> {
  return db
    .collection<OrgUnit>(ORG_UNITS_COLLECTION)
    .find({ tenantId })
    .sort({ name: 1 })
    .toArray();
}

export async function findOrgUnit(
  db: Db,
  tenantId: string,
  unitId: string
): Promise<OrgUnit | null> {
  return db.collection<OrgUnit>(ORG_UNITS_COLLECTION).findOne({ tenantId, unitId });
}

export async function insertOrgUnit(
  db: Db,
  input: {
    tenantId: string;
    unitId: string;
    name: string;
    kind: UnitKind;
    enabledAppIds: string[];
    responsibleUserIds?: string[];
    status?: UnitStatus;
  }
): Promise<OrgUnit> {
  const apps = normalizeEnabledAppIds(input.enabledAppIds);
  if (!apps.ok) {
    throw new Error(apps.error);
  }
  const now = new Date().toISOString();
  const unit: OrgUnit = {
    _id: orgUnitDocumentId(input.tenantId, input.unitId),
    tenantId: input.tenantId,
    unitId: input.unitId,
    name: input.name.trim(),
    kind: input.kind,
    status: input.status ?? "active",
    responsibleUserIds: input.responsibleUserIds ?? [],
    enabledAppIds: apps.appIds,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<OrgUnit>(ORG_UNITS_COLLECTION).insertOne(unit);
  return unit;
}

export async function updateOrgUnit(
  db: Db,
  tenantId: string,
  unitId: string,
  patch: Partial<Pick<OrgUnit, "name" | "kind" | "status" | "enabledAppIds" | "responsibleUserIds">>
): Promise<OrgUnit | null> {
  const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (patch.name != null) set.name = patch.name.trim();
  if (patch.kind != null) set.kind = patch.kind;
  if (patch.status != null) set.status = patch.status;
  if (patch.responsibleUserIds != null) set.responsibleUserIds = patch.responsibleUserIds;
  if (patch.enabledAppIds != null) {
    const apps = normalizeEnabledAppIds(patch.enabledAppIds);
    if (!apps.ok) throw new Error(apps.error);
    set.enabledAppIds = apps.appIds;
  }
  await db.collection<OrgUnit>(ORG_UNITS_COLLECTION).updateOne({ tenantId, unitId }, { $set: set });
  return findOrgUnit(db, tenantId, unitId);
}
