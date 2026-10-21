/**
 * Recorrido visible de una oportunidad.
 * Solo marca etapas que el historial nombra. No rellena huecos ni calcula un avance.
 */

import { isGrowthFunnelResultKey } from "@/core/growth/funnel-types";
import { intermediateStages } from "@/core/growth/funnel-stages";
import type { GrowthFunnelStage } from "@/core/growth/funnel-types";

export type OpportunityStageMark = "visited" | "current" | "pending";

export interface OpportunityStageHistoryEvent {
  kind: string;
  payload?: Record<string, unknown>;
}

export interface OpportunityStageStepView {
  key: string;
  label: string;
  mark: OpportunityStageMark;
  caption: string;
}

export interface OpportunityStageTrack {
  steps: OpportunityStageStepView[];
  /** Cierre real, si el estado actual es un resultado. No es una etapa del recorrido. */
  resultLabel: string | null;
  notes: string[];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function presentOpportunityStageTrack(input: {
  stages: GrowthFunnelStage[];
  status: string;
  activities: OpportunityStageHistoryEvent[];
}): OpportunityStageTrack {
  const stepsSource = intermediateStages(input.stages);
  const stageKeys = new Set(stepsSource.map((stage) => stage.key));
  const visited = new Set<string>();
  let sawOpen = false;
  let sawTransition = false;
  let illegible = 0;

  for (const activity of input.activities) {
    if (activity.kind === "opportunity_opened") {
      sawOpen = true;
      const openedAt = text(activity.payload?.status);
      if (openedAt && stageKeys.has(openedAt)) visited.add(openedAt);
      continue;
    }
    if (activity.kind !== "opportunity_transitioned") continue;
    sawTransition = true;
    const from = text(activity.payload?.fromState);
    const to = text(activity.payload?.toState);
    if (!from || !to) {
      illegible += 1;
      continue;
    }
    if (stageKeys.has(from)) visited.add(from);
    if (stageKeys.has(to)) visited.add(to);
  }

  const currentKey =
    !isGrowthFunnelResultKey(input.status) && stageKeys.has(input.status)
      ? input.status
      : null;
  const result = input.stages.find(
    (stage) => stage.isResult && stage.key === input.status
  );

  const notes: string[] = [];
  if (stepsSource.length === 0) {
    notes.push("Este embudo no tiene etapas configuradas.");
  }
  if (!sawOpen && !sawTransition) {
    notes.push(
      "El historial no registra apertura ni cambios de etapa. No se marcan etapas anteriores."
    );
  }
  if (illegible > 0) {
    notes.push(
      "Hay movimientos sin etapa de origen o destino. Esas etapas no se marcan."
    );
  }
  if (currentKey && !visited.has(currentKey) && (sawOpen || sawTransition)) {
    notes.push("La etapa actual no aparece en el historial.");
  }
  if (isGrowthFunnelResultKey(input.status) && !sawTransition) {
    notes.push("El cierre no tiene un cambio de etapa registrado.");
  }
  if (
    !currentKey &&
    !isGrowthFunnelResultKey(input.status) &&
    input.status.trim()
  ) {
    notes.push("La etapa actual no está en el embudo configurado.");
  }

  return {
    steps: stepsSource.map((stage) => {
      const mark: OpportunityStageMark =
        stage.key === currentKey
          ? "current"
          : visited.has(stage.key)
            ? "visited"
            : "pending";
      const caption =
        mark === "current"
          ? "Actual"
          : mark === "visited"
            ? "Recorrida"
            : stage.active
              ? "Pendiente"
              : "Inactiva";
      return { key: stage.key, label: stage.label, mark, caption };
    }),
    resultLabel: result?.label ?? null,
    notes,
  };
}
