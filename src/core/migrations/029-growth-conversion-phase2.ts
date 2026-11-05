import { ensureGrowthOpportunityIndexes } from "@/core/growth/indexes";
import {
  backfillFunnelPhase2,
  backfillOpportunityPhase2,
  backfillSpaceConfigPhase2,
} from "@/core/growth/phase2-backfill";
import { GROWTH_FUNNELS_COLLECTION } from "@/core/growth/funnel-types";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_SPACE_CONFIG_COLLECTION,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthSpaceConfig,
} from "@/core/growth/types";
import type { GrowthFunnel } from "@/core/growth/funnel-types";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * Responsable, campos y última actividad.
 * No reescribe actividades ni historial de workflow. No asigna responsable por defecto.
 */
export const migration029GrowthConversionPhase2: MigrationDefinition = {
  id: "029-growth-conversion-phase2",
  description:
    "Índices de responsable, lastActivityAt, campos de embudo y umbral de estancamiento",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthOpportunityIndexes(db);
    const oportunidades = db.collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION);
    const actividades = db.collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION);
    const pending = await oportunidades.find({ lastActivityAt: { $exists: false } }).toArray();
    for (const oportunidad of pending) {
      const latest = await actividades
        .find({ tenantId: oportunidad.tenantId, oportunidadId: oportunidad._id })
        .sort({ occurredAt: -1 })
        .limit(1)
        .next();
      const next = backfillOpportunityPhase2(oportunidad, latest?.occurredAt ?? null);
      await oportunidades.updateOne(
        { tenantId: oportunidad.tenantId, _id: oportunidad._id },
        { $set: { lastActivityAt: next.lastActivityAt } }
      );
    }

    const funnels = db.collection<GrowthFunnel>(GROWTH_FUNNELS_COLLECTION);
    const funnelDocs = await funnels.find({ fields: { $exists: false } }).toArray();
    for (const funnel of funnelDocs) {
      const next = backfillFunnelPhase2(funnel);
      await funnels.updateOne(
        { tenantId: funnel.tenantId, _id: funnel._id },
        { $set: { fields: next.fields ?? [] } }
      );
    }

    const configs = db.collection<GrowthSpaceConfig>(GROWTH_SPACE_CONFIG_COLLECTION);
    const configDocs = await configs.find({ staleAfterDays: { $exists: false } }).toArray();
    for (const config of configDocs) {
      const next = backfillSpaceConfigPhase2(config);
      await configs.updateOne(
        { tenantId: config.tenantId, _id: config._id },
        { $set: { staleAfterDays: next.staleAfterDays } }
      );
    }

    log(
      `phase2 opportunities=${pending.length} funnels=${funnelDocs.length} configs=${configDocs.length}`
    );
    const created = results.filter((item) => item.result === "created").length;
    return {
      documentsAffected: pending.length + funnelDocs.length + configDocs.length + created,
      skipped: results.length - created,
      details: [
        ...results.map((item) => `index ${item.name}=${item.result}`),
        `opportunities=${pending.length}`,
        `funnels=${funnelDocs.length}`,
        `configs=${configDocs.length}`,
      ],
    };
  },
};
