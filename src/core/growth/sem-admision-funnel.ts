import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import {
  GROWTH_FUNNEL_RESULTS,
  isGrowthFunnelResultKey,
  type GrowthFunnelStage,
} from "./funnel-types";

export const SEM_ADMISION_FUNNEL_NAME = "Admisión" as const;

export const SEM_ADMISION_STAGE_KEYS = [
  "interes",
  "contactado",
  "orientacion",
  "postulacion",
  "en-revision",
  "listo-matricular",
] as const;

export type SemAdmisionStageKey = (typeof SEM_ADMISION_STAGE_KEYS)[number];

const SEM_LABELS: Record<SemAdmisionStageKey, string> = {
  interes: "Interés",
  contactado: "Contactado",
  orientacion: "Orientación",
  postulacion: "Postulación",
  "en-revision": "En revisión",
  "listo-matricular": "Listo para matricular",
};

const SEM_KEY_SET = new Set<string>(SEM_ADMISION_STAGE_KEYS);

export function semAdmisionIntermediateStages(): GrowthFunnelStage[] {
  return SEM_ADMISION_STAGE_KEYS.map((key, position) => ({
    key,
    label: SEM_LABELS[key],
    position,
    active: true,
    isInitial: key === "interes",
    isResult: false,
  }));
}

export function semAdmisionStages(): GrowthFunnelStage[] {
  return [
    ...semAdmisionIntermediateStages(),
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

export function isSemAdmisionStages(stages: GrowthFunnelStage[]): boolean {
  const intermediates = stages
    .filter((stage) => !stage.isResult && !isGrowthFunnelResultKey(stage.key))
    .slice()
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
  const results = stages
    .filter((stage) => stage.isResult)
    .slice();
  if (intermediates.length !== SEM_ADMISION_STAGE_KEYS.length) return false;
  if (
    !intermediates.every(
      (stage, index) => stage.key === SEM_ADMISION_STAGE_KEYS[index] && stage.active
    )
  ) {
    return false;
  }
  if (
    results.length !== GROWTH_FUNNEL_RESULTS.length ||
    !results.every((stage, index) => stage.key === GROWTH_FUNNEL_RESULTS[index].key && stage.isResult)
  ) {
    return false;
  }
  return intermediates.find((stage) => stage.isInitial)?.key === "interes";
}

/** null = no cambiar (resultado, o ya es etapa SEM). */
export function mapLegacyStatusToSemAdmision(status: string): string | null {
  const key = status.trim();
  if (!key) return "interes";
  if (isGrowthOpportunityFinalStatus(key) || isGrowthFunnelResultKey(key)) return null;
  if (SEM_KEY_SET.has(key)) return null;
  if (key === "open") return "interes";
  return "contactado";
}
