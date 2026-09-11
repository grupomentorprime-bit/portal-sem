import { ensureGrowthActivityIndexes } from "@/core/growth/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-CORE-004 — reafirma índices growth_actividades (append-only + ingestKey).
 * Idempotente. Sin backfill ni UI. Sin segundo Event Bus.
 */
export const migration015GrowthActividades: MigrationDefinition = {
  id: "015-growth-actividades",
  description:
    "Índices tenant-scoped de growth_actividades (timeline, oportunidad, ingestKey unique sparse)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthActivityIndexes(db);
    const details = results.map((r) => `index ${r.name}=${r.result}`);
    for (const line of details) log(line);

    let documentsAffected = 0;
    let skipped = 0;
    for (const r of results) {
      if (r.result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    return { documentsAffected, skipped, details };
  },
};
