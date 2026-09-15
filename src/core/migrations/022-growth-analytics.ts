import {
  ensureGrowthOpportunityIndexes,
  ensureGrowthPersonaIndexes,
} from "@/core/growth/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 — índices Analítica V1.
 * Idempotente. No crea colecciones de métricas ni warehouse.
 */
export const migration022GrowthAnalytics: MigrationDefinition = {
  id: "022-growth-analytics",
  description:
    "Índices Analítica V1 (personas.createdAt, oportunidades openedAt/closedAt/campaign)",
  modules: [],

  async run({ db, log }) {
    const a = await ensureGrowthPersonaIndexes(db);
    const b = await ensureGrowthOpportunityIndexes(db);
    const results = [...a.results, ...b.results];
    const analyticsNames = new Set([
      "tenantId_createdAt",
      "tenantId_openedAt",
      "tenantId_status_openedAt",
      "tenantId_closedAt",
      "tenantId_originCampaign_openedAt",
    ]);
    const focused = results.filter((r) => analyticsNames.has(r.name));
    const details = focused.map((r) => `index ${r.name}=${r.result}`);
    for (const line of details) log(line);

    let documentsAffected = 0;
    let skipped = 0;
    for (const r of focused) {
      if (r.result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    return { documentsAffected, skipped, details };
  },
};
