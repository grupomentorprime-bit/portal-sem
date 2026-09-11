/**
 * Persistencia compartida append-only de growth_actividades.
 * Una sola semántica insert + setEventId (campo técnico post-bus).
 */

import type { Collection } from "mongodb";
import type { GrowthActivity } from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export async function insertActivityIdempotent(
  collection: Collection<GrowthActivity>,
  activity: GrowthActivity
): Promise<GrowthActivity> {
  if (activity.ingestKey) {
    const existing = await collection.findOne({
      tenantId: activity.tenantId,
      ingestKey: activity.ingestKey,
    });
    if (existing) return existing;
  }
  const doc = omitUndefined({ ...activity }) as GrowthActivity;
  try {
    await collection.insertOne(doc);
    return doc;
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000 && activity.ingestKey) {
      const existing = await collection.findOne({
        tenantId: activity.tenantId,
        ingestKey: activity.ingestKey,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function setActivityEventIdInCollection(
  collection: Collection<GrowthActivity>,
  tenantId: string,
  activityId: string,
  eventId: string
): Promise<GrowthActivity | null> {
  const result = await collection.findOneAndUpdate(
    { tenantId, _id: activityId, eventId: { $exists: false } },
    { $set: { eventId } },
    { returnDocument: "after" }
  );
  if (result) return result;
  return collection.findOne({ tenantId, _id: activityId });
}

export async function findActivityByIngestKeyInCollection(
  collection: Collection<GrowthActivity>,
  tenantId: string,
  ingestKey: string
): Promise<GrowthActivity | null> {
  return collection.findOne({ tenantId, ingestKey });
}

/** Memoria: insert idempotente por ingestKey. */
export function createMemoryActivityMap(): {
  activities: Map<string, GrowthActivity>;
  recordActivity(activity: GrowthActivity): Promise<GrowthActivity>;
  setActivityEventId(
    tenantId: string,
    activityId: string,
    eventId: string
  ): Promise<GrowthActivity | null>;
  findActivityByIngestKey(
    tenantId: string,
    ingestKey: string
  ): Promise<GrowthActivity | null>;
} {
  const activities = new Map<string, GrowthActivity>();

  function key(tenantId: string, id: string) {
    return `${tenantId}::${id}`;
  }

  return {
    activities,
    async recordActivity(activity) {
      if (activity.ingestKey) {
        for (const existing of activities.values()) {
          if (
            existing.tenantId === activity.tenantId &&
            existing.ingestKey === activity.ingestKey
          ) {
            return structuredClone(existing);
          }
        }
      }
      activities.set(
        key(activity.tenantId, activity._id),
        structuredClone(activity)
      );
      return structuredClone(activity);
    },
    async setActivityEventId(tenantId, activityId, eventId) {
      const k = key(tenantId, activityId);
      const existing = activities.get(k);
      if (!existing) return null;
      if (existing.eventId) return structuredClone(existing);
      const next = { ...existing, eventId };
      activities.set(k, next);
      return structuredClone(next);
    },
    async findActivityByIngestKey(tenantId, ingestKey) {
      for (const existing of activities.values()) {
        if (existing.tenantId === tenantId && existing.ingestKey === ingestKey) {
          return structuredClone(existing);
        }
      }
      return null;
    },
  };
}
