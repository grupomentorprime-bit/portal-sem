/**
 * ADR-010 §5 — índices tenant-scoped Growth Core.
 * Idempotente (createIndex / IndexOptionsConflict).
 */

import type { Db } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  GROWTH_SPACE_CONFIG_COLLECTION,
} from "./types";

export type EnsureIndexResult = "created" | "exists";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: {
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }
): Promise<EnsureIndexResult> {
  try {
    const indexOptions: {
      name: string;
      background: boolean;
      unique?: boolean;
      sparse?: boolean;
    } = {
      name: options.name,
      background: true,
    };
    if (options.unique) indexOptions.unique = true;
    if (options.sparse) indexOptions.sparse = true;
    await collection.createIndex(keys, indexOptions);
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

export async function ensureGrowthPersonaIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const personas = db.collection(GROWTH_PERSONAS_COLLECTION);
  const actividades = db.collection(GROWTH_ACTIVIDADES_COLLECTION);

  const specs: Array<{
    collection: typeof personas | typeof actividades;
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }> = [
    {
      collection: personas,
      keys: { tenantId: 1, emailNormalized: 1 },
      name: "tenantId_emailNormalized_unique",
      unique: true,
      sparse: true,
    },
    {
      collection: personas,
      keys: { tenantId: 1, phoneNormalized: 1 },
      name: "tenantId_phoneNormalized_unique",
      unique: true,
      sparse: true,
    },
    {
      collection: personas,
      keys: { tenantId: 1, updatedAt: -1 },
      name: "tenantId_updatedAt",
    },
    // Mínimo para idempotencia (CORE-004 ampliará el resto de actividades)
    {
      collection: actividades,
      keys: { tenantId: 1, ingestKey: 1 },
      name: "tenantId_ingestKey_unique",
      unique: true,
      sparse: true,
    },
  ];

  const results: Array<{ name: string; result: EnsureIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, {
      name: spec.name,
      unique: spec.unique,
      sparse: spec.sparse,
    });
    results.push({ name: spec.name, result });
  }

  return { results };
}

/** Índices OT-GROWTH-CORE-003 — oportunidades + space_config (+ actividades por oportunidad). */
export async function ensureGrowthOpportunityIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const oportunidades = db.collection(GROWTH_OPORTUNIDADES_COLLECTION);
  const spaceConfigs = db.collection(GROWTH_SPACE_CONFIG_COLLECTION);
  const actividades = db.collection(GROWTH_ACTIVIDADES_COLLECTION);

  const specs: Array<{
    collection:
      | typeof oportunidades
      | typeof spaceConfigs
      | typeof actividades;
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }> = [
    {
      collection: oportunidades,
      keys: { tenantId: 1, personaId: 1, status: 1 },
      name: "tenantId_personaId_status",
    },
    {
      collection: oportunidades,
      keys: {
        tenantId: 1,
        personaId: 1,
        typeKey: 1,
        subjectType: 1,
        subjectId: 1,
      },
      name: "tenantId_personaId_typeKey_subject",
    },
    {
      collection: spaceConfigs,
      keys: { tenantId: 1 },
      name: "tenantId_unique",
      unique: true,
    },
    {
      collection: actividades,
      keys: { tenantId: 1, personaId: 1, occurredAt: -1 },
      name: "tenantId_personaId_occurredAt",
    },
    {
      collection: actividades,
      keys: { tenantId: 1, oportunidadId: 1, occurredAt: -1 },
      name: "tenantId_oportunidadId_occurredAt",
    },
    // Reafirma ingestKey (idempotente si ya lo creó 013)
    {
      collection: actividades,
      keys: { tenantId: 1, ingestKey: 1 },
      name: "tenantId_ingestKey_unique",
      unique: true,
      sparse: true,
    },
  ];

  const results: Array<{ name: string; result: EnsureIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, {
      name: spec.name,
      unique: spec.unique,
      sparse: spec.sparse,
    });
    results.push({ name: spec.name, result });
  }

  return { results };
}

/** Índices OT-GROWTH-CORE-004 — reafirma timeline append-only (persona / oportunidad / ingestKey). */
export async function ensureGrowthActivityIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const actividades = db.collection(GROWTH_ACTIVIDADES_COLLECTION);

  const specs: Array<{
    collection: typeof actividades;
    keys: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
    sparse?: boolean;
  }> = [
    {
      collection: actividades,
      keys: { tenantId: 1, personaId: 1, occurredAt: -1 },
      name: "tenantId_personaId_occurredAt",
    },
    {
      collection: actividades,
      keys: { tenantId: 1, oportunidadId: 1, occurredAt: -1 },
      name: "tenantId_oportunidadId_occurredAt",
    },
    {
      collection: actividades,
      keys: { tenantId: 1, ingestKey: 1 },
      name: "tenantId_ingestKey_unique",
      unique: true,
      sparse: true,
    },
  ];

  const results: Array<{ name: string; result: EnsureIndexResult }> = [];
  for (const spec of specs) {
    const result = await ensureIndex(spec.collection, spec.keys, {
      name: spec.name,
      unique: spec.unique,
      sparse: spec.sparse,
    });
    results.push({ name: spec.name, result });
  }

  return { results };
}

/** Personas + Oportunidades + Actividades (ensure completo del núcleo actual). */
export async function ensureGrowthCoreIndexes(db: Db): Promise<{
  results: Array<{ name: string; result: EnsureIndexResult }>;
}> {
  const a = await ensureGrowthPersonaIndexes(db);
  const b = await ensureGrowthOpportunityIndexes(db);
  const c = await ensureGrowthActivityIndexes(db);
  return { results: [...a.results, ...b.results, ...c.results] };
}
