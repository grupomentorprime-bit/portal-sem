/**
 * Tablero de Ventas: un carril por embudo.
 * Las columnas son etapas intermedias. Los resultados no son columnas.
 */

import { isGrowthOpportunityFinalStatus } from "@/core/growth/opportunity-definition";
import { intermediateStages } from "@/core/growth/funnel-stages";
import {
  GROWTH_FUNNEL_RESULTS,
  type GrowthFunnel,
  type GrowthFunnelStage,
} from "@/core/growth/funnel-types";
import type {
  GrowthVentasBoardLane,
  GrowthVentasQueueItemView,
  GrowthVentasStageColumn,
  GrowthVentasStatusOption,
} from "./ventas-view";

export function growthVentasBoardLanes(
  tenantId: string,
  funnels: GrowthFunnel[],
  stagesByFunnel: Map<string, GrowthFunnelStage[]>,
  funnelFilter: string | undefined,
  items: GrowthVentasQueueItemView[]
): GrowthVentasBoardLane[] {
  const own = funnels.filter((funnel) => funnel.tenantId === tenantId);
  const visible = items.filter((item) => item.funnelKey);
  const selected = funnelFilter
    ? own.filter((funnel) => funnel.key === funnelFilter)
    : own.filter(
        (funnel) =>
          funnel.status === "active" ||
          visible.some((item) => item.funnelKey === funnel.key)
      );
  const lanes = selected
    .slice()
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name, "es")
    )
    .map((funnel) => {
      const funnelItems = visible.filter((item) => item.funnelKey === funnel.key);
      return {
        funnelKey: funnel.key,
        funnelName: funnel.name,
        isDefault: funnel.isDefault,
        columns: columnsForFunnel(stagesByFunnel.get(funnel.key) ?? [], funnelItems),
      };
    });
  if (funnelFilter) return lanes;
  const known = new Set(lanes.map((lane) => lane.funnelKey));
  const missing = [
    ...new Set(visible.filter((item) => !known.has(item.funnelKey)).map((item) => item.funnelKey)),
  ];
  for (const key of missing) {
    const funnelItems = visible.filter((item) => item.funnelKey === key);
    lanes.push({
      funnelKey: key,
      funnelName: funnelItems[0]?.funnelName ?? key,
      isDefault: false,
      columns: columnsForFunnel([], funnelItems),
    });
  }
  return lanes;
}

export function growthVentasStatusOptions(
  tenantId: string,
  funnels: GrowthFunnel[],
  stagesByFunnel: Map<string, GrowthFunnelStage[]>,
  funnelFilter: string | undefined
): GrowthVentasStatusOption[] {
  const scope = (funnelFilter
    ? funnels.filter((funnel) => funnel.tenantId === tenantId && funnel.key === funnelFilter)
    : funnels.filter((funnel) => funnel.tenantId === tenantId)
  )
    .slice()
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name, "es")
    );
  const options: GrowthVentasStatusOption[] = [];
  const seen = new Set<string>();
  for (const funnel of scope) {
    for (const stage of intermediateStages(stagesByFunnel.get(funnel.key) ?? [])) {
      if (seen.has(stage.key)) continue;
      seen.add(stage.key);
      options.push({ value: stage.key, label: stage.label });
    }
  }
  for (const result of GROWTH_FUNNEL_RESULTS) {
    if (seen.has(result.key)) continue;
    options.push({ value: result.key, label: result.label });
  }
  return options;
}

function columnsForFunnel(
  stages: GrowthFunnelStage[],
  items: GrowthVentasQueueItemView[]
): GrowthVentasStageColumn[] {
  const columns: GrowthVentasStageColumn[] = intermediateStages(stages)
    .filter(
      (stage) => stage.active || items.some((item) => item.status === stage.key)
    )
    .map((stage) => ({
      key: stage.key,
      label: stage.label,
      position: stage.position,
      active: stage.active,
    }));
  for (const item of items) {
    if (isGrowthOpportunityFinalStatus(item.status)) continue;
    if (columns.some((column) => column.key === item.status)) continue;
    columns.push({
      key: item.status,
      label: item.stageLabel,
      position: columns.length,
      active: true,
    });
  }
  return columns.sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}
