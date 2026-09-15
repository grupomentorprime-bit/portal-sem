/**
 * Índices tenant-scoped Campañas (OT-GROWTH-CAMPAIGNS-003).
 * - tenantId + trackingKey UNIQUE
 * - tenantId + status
 * - partial unique: una sola active por tenantId + source.formId
 */

import type { Db } from "mongodb";
import { GROWTH_CAMPAIGNS_COLLECTION } from "./types";

export type EnsureIndexResult = "created" | "exists";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: {
    name: string;
    unique?: boolean;
    partialFilterExpression?: Record<string, unknown>;
  }
): Promise<EnsureIndexResult> {
  try {
    await collection.createIndex(keys, {
      name: options.name,
      background: true,
      ...(options.unique ? { unique: true } : {}),
      ...(options.partialFilterExpression
        ? { partialFilterExpression: options.partialFilterExpression }
        : {}),
    });
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

export async function ensureGrowthCampaignIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const campaigns = db.collection(GROWTH_CAMPAIGNS_COLLECTION);

  const specs: Array<{
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
    partialFilterExpression?: Record<string, unknown>;
  }> = [
    {
      keys: { tenantId: 1, trackingKey: 1 },
      name: "tenantId_trackingKey_unique",
      unique: true,
    },
    {
      keys: { tenantId: 1, status: 1 },
      name: "tenantId_status",
    },
    {
      keys: { tenantId: 1, updatedAt: -1 },
      name: "tenantId_updatedAt",
    },
    // Máximo una campaña active por formulario del Espacio (no solo UI).
    {
      keys: { tenantId: 1, "source.formId": 1 },
      name: "tenantId_sourceFormId_active_unique",
      unique: true,
      partialFilterExpression: {
        status: "active",
        "source.kind": "form",
      },
    },
  ];

  const results: Array<{ name: string; result: EnsureIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(campaigns, spec.keys, {
      name: spec.name,
      unique: spec.unique,
      partialFilterExpression: spec.partialFilterExpression,
    });
    results.push({ name: spec.name, result });
  }
  return { results };
}
