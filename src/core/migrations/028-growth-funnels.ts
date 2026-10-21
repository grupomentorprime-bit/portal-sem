import { ensureGrowthFunnelIndexes } from "@/core/growth/indexes";
import { ensureGrowthFunnelsForTenant } from "@/core/growth/funnels";
import { GROWTH_OPORTUNIDADES_COLLECTION } from "@/core/growth/types";
import { GROWTH_SPACE_CONFIG_COLLECTION } from "@/core/growth/types";
import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * Embudo `default` por Espacio y backfill de oportunidades.
 * No regenera actividades ni reescribe workflow_history.
 */
export const migration028GrowthFunnels: MigrationDefinition = {
  id: "028-growth-funnels",
  description:
    "Embudos growth_funnels, índice por embudo y migración al embudo default",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthFunnelIndexes(db);
    const directory = createMongoGrowthFunnelDirectory(db);
    const [fromOpps, fromDefs, fromConfig] = await Promise.all([
      db.collection(GROWTH_OPORTUNIDADES_COLLECTION).distinct("tenantId"),
      db.collection("workflow_definitions").distinct("tenantId", {
        key: "growth.opportunity",
      }),
      db.collection(GROWTH_SPACE_CONFIG_COLLECTION).distinct("tenantId"),
    ]);
    const tenants = [
      ...new Set(
        [...fromOpps, ...fromDefs, ...fromConfig]
          .map((id) => String(id ?? "").trim())
          .filter(Boolean)
      ),
    ];
    for (const tenantId of tenants) {
      await ensureGrowthFunnelsForTenant(directory, tenantId);
      log(`funnel default ensured tenant=${tenantId}`);
    }
    const created = results.filter((item) => item.result === "created").length;
    return {
      documentsAffected: tenants.length + created,
      skipped: results.length - created,
      details: [
        ...results.map((item) => `index ${item.name}=${item.result}`),
        `tenants=${tenants.length}`,
      ],
    };
  },
};
