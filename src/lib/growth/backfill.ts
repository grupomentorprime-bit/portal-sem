/**
 * OT-GROWTH-CORE-006 — runner de producción (Mongo) para backfill.
 */

import "server-only";

import {
  createMongoGrowthBackfillSource,
  ensureGrowthCoreIndexes,
  openGrowthOpportunityStore,
  openGrowthPersonaStore,
  runGrowthBackfill,
  type GrowthBackfillOptions,
  type GrowthBackfillSummary,
  type GrowthIngestDeps,
} from "@/core/growth";
import { getDatabase } from "@/lib/mongodb";
import { createGrowthEventBusAdapter } from "./event-bus";
import { createMongoGrowthOpportunityWorkflow } from "./opportunity-workflow";

async function openBackfillDeps(): Promise<GrowthIngestDeps> {
  const db = await getDatabase();
  await ensureGrowthCoreIndexes(db);
  const [personas, oportunidades] = await Promise.all([
    openGrowthPersonaStore(db),
    openGrowthOpportunityStore(db),
  ]);
  return {
    personas,
    oportunidades,
    workflow: createMongoGrowthOpportunityWorkflow(),
    eventBus: createGrowthEventBusAdapter(),
  };
}

/**
 * Ejecuta backfill de un Espacio contra Mongo.
 * Fuentes: solo lectura. Destinos no V1 cuentan como omitidos.
 */
export async function runMongoGrowthBackfill(
  options: GrowthBackfillOptions
): Promise<GrowthBackfillSummary> {
  const db = await getDatabase();
  const deps = await openBackfillDeps();
  const reader = createMongoGrowthBackfillSource(db);
  return runGrowthBackfill(deps, reader, options);
}

export { createMongoGrowthBackfillSource };
