/**
 * OT-GROWTH-AUTOMATION-003 / ADR-011 — evaluación de condiciones V1.
 * Solo predicados del catálogo cerrado sobre la Oportunidad del Espacio.
 */

import type { GrowthOportunidad } from "@/core/growth/types";
import type { GrowthAutomationConditionRule } from "./types";

export function evaluateAutomationConditionRule(
  oportunidad: GrowthOportunidad,
  rule: GrowthAutomationConditionRule
): boolean {
  switch (rule.field) {
    case "origin.kind":
      return oportunidad.origin.kind === rule.value;
    case "origin.channel":
      return (oportunidad.origin.channel ?? "") === rule.value;
    case "origin.formDestination":
      return (oportunidad.origin.formDestination ?? "") === rule.value;
    case "status":
      return oportunidad.status === rule.value;
    case "typeKey":
      return oportunidad.typeKey === rule.value;
    case "nextAction":
      return rule.op === "exists"
        ? oportunidad.nextAction != null
        : oportunidad.nextAction == null;
    default: {
      const _exhaustive: never = rule;
      void _exhaustive;
      return false;
    }
  }
}

/** Todas las reglas de un paso condición deben cumplirse (AND). */
export function evaluateAutomationConditionRules(
  oportunidad: GrowthOportunidad,
  rules: GrowthAutomationConditionRule[]
): boolean {
  if (rules.length === 0) return false;
  return rules.every((rule) => evaluateAutomationConditionRule(oportunidad, rule));
}
