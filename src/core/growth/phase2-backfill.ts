/**
 * Compatibilidad de fase 2. No reescribe actividades ni historial de workflow.
 */

import { GROWTH_DEFAULT_STALE_AFTER_DAYS } from "./priority";
import type { GrowthFunnel } from "./funnel-types";
import type { GrowthOportunidad, GrowthSpaceConfig } from "./types";

export function backfillOpportunityPhase2(
  oportunidad: GrowthOportunidad,
  latestActivityAt: string | null
): GrowthOportunidad {
  if (oportunidad.lastActivityAt) return oportunidad;
  return {
    ...oportunidad,
    lastActivityAt: latestActivityAt || oportunidad.updatedAt,
  };
}

export function backfillFunnelPhase2(funnel: GrowthFunnel): GrowthFunnel {
  if (funnel.fields) return funnel;
  return { ...funnel, fields: [] };
}

export function backfillSpaceConfigPhase2(config: GrowthSpaceConfig): GrowthSpaceConfig {
  if (config.staleAfterDays != null) return config;
  return { ...config, staleAfterDays: GROWTH_DEFAULT_STALE_AFTER_DAYS };
}
