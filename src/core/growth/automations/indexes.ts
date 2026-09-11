/**
 * Índices tenant-scoped Automatizaciones (OT-GROWTH-AUTOMATION-002).
 */

import type { Db } from "mongodb";
import {
  GROWTH_AUTOMATIONS_COLLECTION,
  GROWTH_AUTOMATION_VERSIONS_COLLECTION,
  GROWTH_AUTOMATION_RUNS_COLLECTION,
} from "./types";

export type EnsureIndexResult = "created" | "exists";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: {
    name: string;
    unique?: boolean;
  }
): Promise<EnsureIndexResult> {
  try {
    await collection.createIndex(keys, {
      name: options.name,
      background: true,
      ...(options.unique ? { unique: true } : {}),
    });
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

export async function ensureGrowthAutomationIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const automations = db.collection(GROWTH_AUTOMATIONS_COLLECTION);
  const versions = db.collection(GROWTH_AUTOMATION_VERSIONS_COLLECTION);
  const runs = db.collection(GROWTH_AUTOMATION_RUNS_COLLECTION);

  const specs: Array<{
    collection: typeof automations | typeof versions | typeof runs;
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
  }> = [
    {
      collection: automations,
      keys: { tenantId: 1, updatedAt: -1 },
      name: "tenantId_updatedAt",
    },
    {
      collection: automations,
      keys: { tenantId: 1, status: 1 },
      name: "tenantId_status",
    },
    {
      collection: versions,
      keys: { tenantId: 1, automationId: 1, version: 1 },
      name: "tenantId_automationId_version_unique",
      unique: true,
    },
    {
      collection: versions,
      keys: { tenantId: 1, automationId: 1, status: 1 },
      name: "tenantId_automationId_status",
    },
    {
      collection: runs,
      keys: { tenantId: 1, automationId: 1, attemptKey: 1 },
      name: "tenantId_automationId_attemptKey_unique",
      unique: true,
    },
    {
      collection: runs,
      keys: { tenantId: 1, automationId: 1, startedAt: -1 },
      name: "tenantId_automationId_startedAt",
    },
  ];

  const results: Array<{ name: string; result: EnsureIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, {
      name: spec.name,
      unique: spec.unique,
    });
    results.push({ name: spec.name, result });
  }
  return { results };
}
