import { ensureGrowthOpportunityIndexes } from "@/core/growth/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-CORE-003 — índices growth_oportunidades + growth_space_config
 * (+ actividades por persona/oportunidad). Idempotente. Sin backfill ni UI.
 */
export const migration014GrowthOportunidades: MigrationDefinition = {
  id: "014-growth-oportunidades",
  description:
    "Índices tenant-scoped de growth_oportunidades, growth_space_config y actividades por oportunidad",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthOpportunityIndexes(db);
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
