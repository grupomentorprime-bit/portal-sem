/**
 * Métricas derivadas Campañas V1 — no materializadas.
 * Base: oportunidades con origin.campaign === trackingKey (mismo tenant).
 */

import type { GrowthOportunidad } from "@/core/growth/types";
import type { GrowthCampaignMetrics } from "./types";

export function deriveCampaignMetrics(
  oportunidades: GrowthOportunidad[]
): GrowthCampaignMetrics {
  const personaIds = new Set<string>();
  let enSeguimiento = 0;
  let ganadas = 0;
  let perdidas = 0;

  for (const o of oportunidades) {
    personaIds.add(o.personaId);
    if (o.status === "active") enSeguimiento += 1;
    else if (o.status === "won") ganadas += 1;
    else if (o.status === "lost") perdidas += 1;
  }

  return {
    personasCaptadas: personaIds.size,
    oportunidadesGeneradas: oportunidades.length,
    enSeguimiento,
    ganadas,
    perdidas,
  };
}

export function filterOportunidadesByCampaign(
  oportunidades: GrowthOportunidad[],
  tenantId: string,
  trackingKey: string
): GrowthOportunidad[] {
  return oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      (o.origin.campaign ?? "") === trackingKey
  );
}
