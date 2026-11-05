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
  occurredAt?: string;
  payload?: Record<string, unknown>;
}

export interface OpportunityStageStepView {
  key: string;
  label: string;
  mark: OpportunityStageMark;
  caption: string;
  /** Mención más reciente en el historial. Null si esa etapa no está nombrada. */
  occurredAt: string | null;
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
  /** Fecha de apertura del documento. No completa etapas que el historial no nombra. */
  openedAt?: string;
}): OpportunityStageTrack {
  const stepsSource = intermediateStages(input.stages);
  const stageKeys = new Set(stepsSource.map((stage) => stage.key));
  const visited = new Set<string>();
  const mentionedAt = new Map<string, string>();
  let sawOpen = false;
  let sawTransition = false;
  let illegible = 0;

  const ordered = [...input.activities].sort((a, b) =>
    (a.occurredAt ?? "").localeCompare(b.occurredAt ?? "")
  );

  const remember = (key: string | null, at: string | undefined) => {
    if (!key || !stageKeys.has(key)) return;
    visited.add(key);
    const when = text(at);
    if (when) mentionedAt.set(key, when);
  };

  for (const activity of ordered) {
    if (activity.kind === "opportunity_opened") {
      sawOpen = true;
      remember(text(activity.payload?.status), activity.occurredAt);
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
    remember(from, activity.occurredAt);
    remember(to, activity.occurredAt);
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
  const initialKey =
    stepsSource.find((stage) => stage.isInitial)?.key ?? stepsSource[0]?.key ?? null;
  const openingDate = text(input.openedAt);
  const usedOpeningDate = Boolean(
    currentKey &&
      initialKey &&
      currentKey === initialKey &&
      !sawOpen &&
      !sawTransition &&
      openingDate
  );
  if (!sawOpen && !sawTransition) {
    notes.push(
      usedOpeningDate
        ? "El historial no registra apertura ni cambios de etapa. No se marcan etapas anteriores. La fecha de la etapa actual es la de apertura."
        : "El historial no registra apertura ni cambios de etapa. No se marcan etapas anteriores."
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

  const steps = stepsSource.map((stage) => {
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
    return {
      key: stage.key,
      label: stage.label,
      mark,
      caption,
      occurredAt:
        mark === "pending"
          ? null
          : (mentionedAt.get(stage.key) ??
            (usedOpeningDate && stage.key === currentKey ? openingDate : null)),
    };
  });

  const skipNote = describeSkippedStages(steps);
  if (skipNote) notes.push(skipNote);

  return {
    steps,
    resultLabel: result?.label ?? null,
    notes,
  };
}

/** Etapas pendientes entre dos puntos que el historial sí nombra. No inventa recorrido. */
function describeSkippedStages(steps: OpportunityStageStepView[]): string | null {
  const reached = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.mark === "visited" || step.mark === "current");
  if (reached.length === 0) return null;
  const from = Math.min(...reached.map((entry) => entry.index));
  const to = Math.max(...reached.map((entry) => entry.index));
  if (to <= from) return null;
  const skipped = steps.filter(
    (step, index) => index > from && index < to && step.mark === "pending"
  );
  if (skipped.length === 0) return null;
  const jump = `el historial salta de ${steps[from].label} a ${steps[to].label}`;
  if (skipped.length === 1) {
    return `${skipped[0].label} queda pendiente: ${jump}.`;
  }
  return `${skipped.map((step) => step.label).join(", ")} quedan pendientes: ${jump}.`;
}
