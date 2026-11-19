import "server-only";

import { randomUUID } from "node:crypto";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { PLATFORM_ROLE_CODES } from "@/core/identity/platform/codes";
import {
  activateCommercialCase,
  legacyCaseFromThread,
  mergeAttentionAreas,
  noteCommercialRequest,
  normalizeGrant,
  type AttentionArea,
  type AttentionCase,
  type AttentionColleague,
  type LegacyAttentionThread,
} from "@/lib/desktop/attention";
import type { MentorAppId } from "@/lib/desktop/catalog";
import { formatCorrelative, type HelpLocation } from "@/lib/desktop/help-origins";
import type { ReportDispatchRecord } from "@/lib/desktop/platform-desk";
import { getDatabase } from "@/lib/mongodb";

const CASES = "attention_cases";
const CONFIG = "attention_config";
const THREADS = "attention_threads";
const LOCATIONS = "attention_locations";

interface ConfigDoc {
  _id: "config";
  areas: AttentionArea[];
  grants: Array<{ userId: string; areaIds: string[] }>;
}

function withoutId(doc: AttentionCase & { _id?: unknown }): AttentionCase {
  const { _id, ...item } = doc;
  void _id;
  return item;
}

async function casesCollection() {
  const db = await getDatabase();
  const collection = db.collection<AttentionCase & { _id: string }>(CASES);
  await collection.createIndex({ tenantId: 1, updatedAt: -1 }, { name: "attention_by_tenant" });
  await collection.createIndex(
    { correlative: 1 },
    { name: "attention_correlative", unique: true, sparse: true }
  );
  return collection;
}

export async function readAttentionConfig(): Promise<{
  areas: AttentionArea[];
  grants: Array<{ userId: string; areaIds: string[] }>;
}> {
  const db = await getDatabase();
  const doc = await db.collection<ConfigDoc>(CONFIG).findOne({ _id: "config" });
  const areas = mergeAttentionAreas(doc?.areas ?? null);
  const grants = (doc?.grants ?? []).flatMap((grant) => {
    const areaIds = normalizeGrant(grant.areaIds, areas);
    if (!grant.userId || areaIds.length === 0) return [];
    return [{ userId: grant.userId, areaIds }];
  });
  return { areas, grants };
}

export async function saveAttentionAreas(areas: AttentionArea[]): Promise<void> {
  const db = await getDatabase();
  await db.collection<ConfigDoc>(CONFIG).updateOne(
    { _id: "config" },
    { $set: { areas } },
    { upsert: true }
  );
}

export async function saveAttentionGrant(userId: string, areaIds: string[]): Promise<void> {
  const current = await readAttentionConfig();
  const grants = current.grants.filter((grant) => grant.userId !== userId);
  if (areaIds.length > 0) grants.push({ userId, areaIds });
  const db = await getDatabase();
  await db.collection<ConfigDoc>(CONFIG).updateOne(
    { _id: "config" },
    { $set: { grants }, $setOnInsert: { areas: current.areas } },
    { upsert: true }
  );
}

export async function saveReportDispatch(item: ReportDispatchRecord): Promise<void> {
  const db = await getDatabase();
  await db.collection<ReportDispatchRecord & { _id: string }>("attention_report_dispatches").insertOne({
    _id: item.id,
    ...item,
  });
}

export async function saveAttentionCase(item: AttentionCase): Promise<void> {
  const collection = await casesCollection();
  await collection.replaceOne({ _id: item.id }, item, { upsert: true });
}

export async function takeCorrelative(): Promise<string> {
  const db = await getDatabase();
  const doc = await db
    .collection<{ _id: string; seq: number }>(CONFIG)
    .findOneAndUpdate({ _id: "correlative" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  const seq = doc?.seq;
  if (!seq || !Number.isInteger(seq) || seq <= 0) {
    throw new Error("attention_correlative_failed");
  }
  return formatCorrelative(seq);
}

export async function findAttentionCaseByCorrelative(code: string): Promise<AttentionCase | null> {
  const correlative = code.trim().toUpperCase();
  if (!correlative) return null;
  const collection = await casesCollection();
  const doc = await collection.findOne({ correlative });
  return doc ? withoutId(doc) : null;
}

export async function saveHelpLocation(location: HelpLocation): Promise<void> {
  const db = await getDatabase();
  const _id = `${location.tenantId}:${location.userId}`;
  await db.collection<HelpLocation & { _id: string }>(LOCATIONS).updateOne(
    { _id },
    { $set: location },
    { upsert: true }
  );
}

export async function readHelpLocation(tenantId: string, userId: string): Promise<HelpLocation | null> {
  if (!tenantId || !userId) return null;
  const db = await getDatabase();
  const doc = await db.collection<HelpLocation & { _id: string }>(LOCATIONS).findOne({
    _id: `${tenantId}:${userId}`,
  });
  if (!doc) return null;
  const { _id, ...location } = doc;
  void _id;
  return location;
}

export async function findAttentionCase(id: string): Promise<AttentionCase | null> {
  const collection = await casesCollection();
  const doc = await collection.findOne({ _id: id });
  return doc ? withoutId(doc) : null;
}

async function importLegacy(tenantId?: string): Promise<void> {
  const db = await getDatabase();
  const threads = await db
    .collection<LegacyAttentionThread>(THREADS)
    .find(tenantId ? { tenantId } : {})
    .toArray();
  if (threads.length === 0) return;
  const collection = await casesCollection();
  for (const thread of threads) {
    const id = `legacy:${thread.tenantId}`;
    const exists = await collection.findOne({ _id: id }, { projection: { _id: 1 } });
    if (exists) continue;
    const created = legacyCaseFromThread(thread, id);
    if (!created) continue;
    try {
      await collection.insertOne({ ...created, _id: created.id });
    } catch (error) {
      if ((error as { code?: unknown }).code === 11000) continue;
      throw error;
    }
  }
}

export async function listAttentionCases(): Promise<AttentionCase[]> {
  await importLegacy();
  const collection = await casesCollection();
  const docs = await collection.find({}).toArray();
  return docs.map((doc) => withoutId(doc));
}

export async function listAttentionCasesForTenant(tenantId: string): Promise<AttentionCase[]> {
  await importLegacy(tenantId);
  const collection = await casesCollection();
  const docs = await collection.find({ tenantId }).toArray();
  return docs.map((doc) => withoutId(doc));
}

export async function findOpenCommercialCase(
  tenantId: string,
  appId: MentorAppId
): Promise<AttentionCase | null> {
  const collection = await casesCollection();
  const doc = await collection.findOne({
    tenantId,
    status: { $ne: "resuelto" },
    "commercial.appId": appId,
  });
  return doc ? withoutId(doc) : null;
}

export async function listAttentionColleagues(): Promise<AttentionColleague[]> {
  const db = await getDatabase();
  const [users, config] = await Promise.all([
    db
      .collection("identity_users")
      .find(
        { status: "active" },
        { projection: { displayName: 1, status: 1, platformRoles: 1 } }
      )
      .toArray(),
    readAttentionConfig(),
  ]);
  const grants = new Map(config.grants.map((grant) => [grant.userId, grant.areaIds]));
  const colleagues: AttentionColleague[] = [];
  for (const user of users) {
    const userId = String(user._id);
    const record = { status: user.status, platformRoles: user.platformRoles };
    const allAreas = hasPlatformOwnerCapability(record);
    const operator = Array.isArray(user.platformRoles)
      && user.platformRoles.includes(PLATFORM_ROLE_CODES.OPERATOR);
    const areaIds = grants.get(userId) ?? [];
    if (!allAreas && !(operator && areaIds.length > 0)) continue;
    colleagues.push({
      userId,
      displayName: String(user.displayName || "").trim() || "Nelzuri",
      allAreas,
      areaIds: allAreas ? config.areas.map((area) => area.id) : areaIds,
    });
  }
  colleagues.sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
  return colleagues;
}

export async function notePlanRequest(input: {
  tenantId: string;
  appId: MentorAppId;
  authorUserId: string;
  authorName: string;
  now?: string;
}): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const existing = await findOpenCommercialCase(input.tenantId, input.appId);
  const next = noteCommercialRequest(existing, {
    ...input,
    id: randomUUID(),
    messageId: randomUUID(),
    eventId: randomUUID(),
    now,
  });
  if (next.already) return;
  await saveAttentionCase(next.case);
}

export async function noteCommercialActivation(input: {
  tenantId: string;
  appId: MentorAppId;
  actorUserId: string;
  actorName: string;
  now?: string;
}): Promise<void> {
  const collection = await casesCollection();
  const docs = await collection
    .find({
      tenantId: input.tenantId,
      "commercial.appId": input.appId,
      "commercial.activation": "pendiente",
    })
    .toArray();
  const now = input.now ?? new Date().toISOString();
  for (const doc of docs) {
    const current = withoutId(doc);
    const next = activateCommercialCase(current, {
      appId: input.appId,
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      messageId: randomUUID(),
      eventId: randomUUID(),
      now,
    });
    if (!next || next === current) continue;
    await saveAttentionCase(next);
  }
}
