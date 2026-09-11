/**
 * Persistencia Mongo de growth_automation_runs (OT-007).
 */

import type { Db } from "mongodb";
import type { GrowthAutomationRunStore } from "./run-store";
import {
  GROWTH_AUTOMATION_RUNS_COLLECTION,
  type GrowthAutomationRun,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthAutomationRunStore(
  db: Db
): GrowthAutomationRunStore {
  const col = db.collection<GrowthAutomationRun>(
    GROWTH_AUTOMATION_RUNS_COLLECTION
  );

  return {
    async upsertRun(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthAutomationRun;
      await col.replaceOne(
        {
          tenantId: clean.tenantId,
          automationId: clean.automationId,
          attemptKey: clean.attemptKey,
        },
        clean,
        { upsert: true }
      );
      return clean;
    },

    async findByAttemptKey(tenantId, automationId, attemptKey) {
      return col.findOne({ tenantId, automationId, attemptKey });
    },

    async listRecent(tenantId, automationId, limit) {
      return col
        .find({ tenantId, automationId })
        .sort({ startedAt: -1 })
        .limit(limit)
        .toArray();
    },
  };
}
