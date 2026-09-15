/**
 * Audiencia dinámica Campañas V1 — filtros AND sobre Oportunidades.
 * Sin snapshots ni personaIds persistidos.
 */

import type { GrowthOportunidad } from "@/core/growth/types";
import type { GrowthCampaignAudienceFilter } from "./types";

export function evaluateCampaignAudienceFilter(
  oportunidad: GrowthOportunidad,
  filter: GrowthCampaignAudienceFilter
): boolean {
  switch (filter.field) {
    case "typeKey":
      return oportunidad.typeKey === filter.value;
    case "status":
      return oportunidad.status === filter.value;
    case "origin.kind":
      return oportunidad.origin.kind === filter.value;
    case "origin.channel":
      return (oportunidad.origin.channel ?? "") === filter.value;
    case "origin.formId":
      return (oportunidad.origin.formId ?? "") === filter.value;
    case "origin.campaign":
      return (oportunidad.origin.campaign ?? "") === filter.value;
    default: {
      const _exhaustive: never = filter;
      void _exhaustive;
      return false;
    }
  }
}

/** Semántica AND: todos los filtros deben cumplirse. */
export function evaluateCampaignAudienceFilters(
  oportunidad: GrowthOportunidad,
  filters: GrowthCampaignAudienceFilter[]
): boolean {
  if (filters.length === 0) return true;
  return filters.every((f) => evaluateCampaignAudienceFilter(oportunidad, f));
}

export function filterOportunidadesByAudience(
  oportunidades: GrowthOportunidad[],
  filters: GrowthCampaignAudienceFilter[]
): GrowthOportunidad[] {
  return oportunidades.filter((o) =>
    evaluateCampaignAudienceFilters(o, filters)
  );
}
