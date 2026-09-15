import { ensureGrowthCampaignIndexes } from "@/core/growth/campaigns/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-CAMPAIGNS-003 — índices growth_campaigns.
 * Idempotente. Sin broadcast, sin runner, sin materialización de métricas.
 */
export const migration021GrowthCampaigns: MigrationDefinition = {
  id: "021-growth-campaigns",
  description:
    "Índices tenant-scoped de Campañas V1 (trackingKey unique + active form unique)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthCampaignIndexes(db);
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
