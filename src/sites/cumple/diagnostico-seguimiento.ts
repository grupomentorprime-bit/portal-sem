import { setGrowthNextAction } from "@/core/growth/next-action";
import type { GrowthOpportunityStore } from "@/core/growth/opportunity-store";
import type { GrowthNextAction, GrowthNextActionKind } from "@/core/growth/types";
import { GROWTH_STARTUP_NEXT_ACTION_SUMMARY } from "@/core/growth/automations/types";
import type { CumpleDiagnostico } from "@/sites/cumple/diagnostico-record";
import type { DiagnosticoResult } from "@/sites/cumple/diagnostico";

export const CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE = "cumple.diagnostico.generic" as const;
export const GROWTH_STARTUP_NEXT_ACTION_SOURCE = "growth.startup.next_action" as const;

export interface CumpleNextActionPlan {
  summary: string;
  kind: GrowthNextActionKind;
  sourceKey: typeof CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE;
}

/** Texto genérico a partir de la brecha principal declarada. */
export function planCumpleNextAction(result: DiagnosticoResult): CumpleNextActionPlan {
  const top = result.priorities[0];
  if (!top) {
    return {
      summary: "Revisar el diagnóstico orientativo: sin brechas declaradas",
      kind: "review",
      sourceKey: CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE,
    };
  }
  const finding = top.findings[0] ?? top.label;
  return {
    summary: `Revisar ${top.label}: ${finding}`,
    kind: top.status === "no_esta" ? "contact" : "review",
    sourceKey: CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE,
  };
}

/** Solo la acción de arranque o la genérica de un diagnóstico anterior. */
export function canReplaceWithDiagnosticoAction(
  current: GrowthNextAction | null | undefined
): boolean {
  if (!current) return true;
  if (current.sourceKey === "operator") return false;
  if (current.sourceKey === CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE) return true;
  if (current.sourceKey === GROWTH_STARTUP_NEXT_ACTION_SOURCE) return true;
  if (!current.sourceKey && current.summary.trim() === GROWTH_STARTUP_NEXT_ACTION_SUMMARY) {
    return true;
  }
  return false;
}

export async function syncCumpleDiagnosticoNextAction(
  store: GrowthOpportunityStore,
  record: CumpleDiagnostico,
  now?: string
): Promise<"updated" | "kept" | "skipped"> {
  if (!record.oportunidadId) return "skipped";
  const oportunidad = await store.findById(record.tenantId, record.oportunidadId);
  if (!oportunidad) return "skipped";
  if (!canReplaceWithDiagnosticoAction(oportunidad.nextAction)) return "kept";

  const plan = planCumpleNextAction(record.result);
  const current = oportunidad.nextAction;
  if (
    current &&
    current.summary === plan.summary &&
    current.kind === plan.kind &&
    current.sourceKey === plan.sourceKey
  ) {
    return "kept";
  }

  const saved = await setGrowthNextAction(store, {
    tenantId: record.tenantId,
    oportunidadId: record.oportunidadId,
    summary: plan.summary,
    kind: plan.kind,
    sourceKey: plan.sourceKey,
    now: now ?? record.createdAt,
  });
  return saved.ok ? "updated" : "skipped";
}
