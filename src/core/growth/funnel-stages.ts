/**
 * Etapas de un embudo y transiciones regeneradas.
 * No es un grafo dibujado a mano: desde cada intermedia se puede ir
 * a cualquier otra intermedia activa y a los cuatro resultados.
 */

import { workflowStateColors } from "@/core/workflow/workflow-colors";
import { GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE } from "./opportunity-definition";
import {
  GROWTH_FUNNEL_RESULTS,
  growthFunnelResultLabel,
  isGrowthFunnelResultKey,
  isGrowthFunnelSlug,
  type GrowthFunnelDefinition,
  type GrowthFunnelStage,
  type GrowthFunnelTransition,
} from "./funnel-types";

export function platformDefaultStages(): GrowthFunnelStage[] {
  const intermediates = GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE.states.filter(
    (state) => !state.isFinal
  );
  const stages: GrowthFunnelStage[] = intermediates.map((state, position) => ({
    key: state.key,
    label: state.label,
    position,
    active: true,
    isInitial: Boolean(state.isInitial),
    isResult: false,
  }));
  if (!stages.some((stage) => stage.isInitial) && stages[0]) {
    stages[0] = { ...stages[0], isInitial: true };
  }
  for (const result of GROWTH_FUNNEL_RESULTS) {
    stages.push({
      key: result.key,
      label: result.label,
      position: 0,
      active: true,
      isInitial: false,
      isResult: true,
    });
  }
  return stages;
}

export function freshFunnelStages(): GrowthFunnelStage[] {
  return [
    {
      key: "open",
      label: "Abierta",
      position: 0,
      active: true,
      isInitial: true,
      isResult: false,
    },
    ...GROWTH_FUNNEL_RESULTS.map((result) => ({
      key: result.key,
      label: result.label,
      position: 0,
      active: true,
      isInitial: false,
      isResult: true,
    })),
  ];
}

export function stagesFromDefinition(
  definition: Pick<GrowthFunnelDefinition, "states"> | null
): GrowthFunnelStage[] {
  if (!definition || definition.states.length === 0) return platformDefaultStages();
  const stages = definition.states.map((state, index) => {
    const isResult = isGrowthFunnelResultKey(state.key) || Boolean(state.isFinal);
    const position =
      typeof state.metadata?.position === "number" ? state.metadata.position : index;
    const active = state.metadata?.active === false ? false : true;
    return {
      key: state.key,
      label: isGrowthFunnelResultKey(state.key)
        ? growthFunnelResultLabel(state.key) ?? state.label
        : state.label,
      position,
      active: isResult ? true : active,
      isInitial: Boolean(state.isInitial) && !isResult,
      isResult,
    } satisfies GrowthFunnelStage;
  });
  if (!stages.some((stage) => stage.isInitial)) {
    const first = stages.find((stage) => !stage.isResult);
    if (first) first.isInitial = true;
  }
  return stages;
}

export function intermediateStages(stages: GrowthFunnelStage[]): GrowthFunnelStage[] {
  return stages
    .filter((stage) => !stage.isResult)
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}

export function initialStageKey(stages: GrowthFunnelStage[]): string {
  return intermediateStages(stages).find((stage) => stage.isInitial)?.key ?? "open";
}

export function stageLabel(stages: GrowthFunnelStage[], key: string): string {
  return stages.find((stage) => stage.key === key)?.label ?? growthFunnelResultLabel(key) ?? key;
}

export function regenerateFunnelTransitions(
  stages: GrowthFunnelStage[]
): GrowthFunnelTransition[] {
  const intermediates = intermediateStages(stages);
  const targets = intermediates.filter((stage) => stage.active);
  const results = stages.filter((stage) => stage.isResult);
  const transitions: GrowthFunnelTransition[] = [];
  for (const from of intermediates) {
    for (const to of targets) {
      if (to.key === from.key) continue;
      transitions.push({
        id: `${from.key}__${to.key}`,
        fromState: from.key,
        toState: to.key,
        label: to.label,
      });
    }
    for (const to of results) {
      transitions.push({
        id: `${from.key}__${to.key}`,
        fromState: from.key,
        toState: to.key,
        label: to.label,
      });
    }
  }
  return transitions;
}

export function definitionFromStages(input: {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  stages: GrowthFunnelStage[];
  version?: number;
}): GrowthFunnelDefinition {
  const stages = normalizeStagePositions(input.stages);
  const initial = initialStageKey(stages);
  return {
    _id: input.id,
    tenantId: input.tenantId,
    key: input.key,
    name: input.name,
    initialState: initial,
    version: input.version ?? 1,
    states: stages.map((stage) => ({
      key: stage.key,
      label: stage.isResult ? growthFunnelResultLabel(stage.key) ?? stage.label : stage.label,
      isInitial: stage.isInitial,
      isFinal: stage.isResult,
      metadata: {
        position: stage.position,
        active: stage.isResult ? true : stage.active,
        role: stage.isResult ? "result" : "intermediate",
      },
    })),
    transitions: regenerateFunnelTransitions(stages),
  };
}

export function normalizeStagePositions(stages: GrowthFunnelStage[]): GrowthFunnelStage[] {
  const intermediates = intermediateStages(stages).map((stage, position) => ({
    ...stage,
    position,
  }));
  const results: GrowthFunnelStage[] = GROWTH_FUNNEL_RESULTS.map((result) => ({
    key: result.key,
    label: result.label,
    position: 0,
    active: true,
    isInitial: false,
    isResult: true,
  }));
  return [...intermediates, ...results];
}

export function validateNewStageKey(
  stages: GrowthFunnelStage[],
  key: string
): "invalid_key" | "reserved_stage" | "duplicate_stage" | null {
  const slug = key.trim();
  if (!isGrowthFunnelSlug(slug)) return "invalid_key";
  if (isGrowthFunnelResultKey(slug)) return "reserved_stage";
  if (stages.some((stage) => stage.key === slug)) return "duplicate_stage";
  return null;
}

export function workflowStateColor(stage: GrowthFunnelStage): string {
  if (stage.isResult && stage.key === "won") return workflowStateColors.published;
  if (stage.isResult && stage.key === "handed_off") return workflowStateColors.approved;
  if (stage.isResult) return workflowStateColors.archived;
  if (stage.isInitial) return workflowStateColors.draft;
  return workflowStateColors.review;
}

export function isPipelineFollowUp(
  status: string,
  funnelKey: string | undefined,
  initialByFunnel: Record<string, string> | undefined
): boolean {
  if (isGrowthFunnelResultKey(status)) return false;
  const initial = initialByFunnel?.[funnelKey || "default"] ?? "open";
  return status !== initial;
}
