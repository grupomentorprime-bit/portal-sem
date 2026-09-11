/**
 * OT-GROWTH-AUTOMATION-003 — ejecución de acciones sales-ops declaradas.
 * Actor fijo: growth-automation. No usa userId del evento/visitante.
 */

import { GROWTH_AUTOMATION_ACTION_TYPES, GROWTH_AUTOMATION_SYSTEM_ACTOR } from "./types";
import type { GrowthAutomationActionStep } from "./types";
import type { GrowthAutomationSalesOpsPort } from "./sales-ops-port";

export type AutomationActionExecution =
  | {
      ok: true;
      action: GrowthAutomationActionStep["action"];
      activityId?: string;
    }
  | {
      ok: false;
      action?: string;
      reason: "invalid_action" | "action_failed";
      detail: string;
    };

function isCatalogAction(
  value: string
): value is (typeof GROWTH_AUTOMATION_ACTION_TYPES)[number] {
  return (GROWTH_AUTOMATION_ACTION_TYPES as readonly string[]).includes(value);
}

/**
 * Valida forma mínima en runtime (defensa si la versión se corrompió)
 * y delega en el puerto sales-ops.
 */
export async function executeAutomationActionStep(input: {
  tenantId: string;
  oportunidadId: string;
  step: GrowthAutomationActionStep | Record<string, unknown>;
  salesOps: GrowthAutomationSalesOpsPort;
}): Promise<AutomationActionExecution> {
  const step = input.step;
  if (
    !step ||
    typeof step !== "object" ||
    (step as { kind?: unknown }).kind !== "action" ||
    typeof (step as { action?: unknown }).action !== "string" ||
    !isCatalogAction((step as { action: string }).action)
  ) {
    return {
      ok: false,
      reason: "invalid_action",
      detail: "Acción fuera de catálogo ADR-011 o forma inválida.",
    };
  }

  const actionStep = step as GrowthAutomationActionStep;
  const actor = { userId: GROWTH_AUTOMATION_SYSTEM_ACTOR };

  switch (actionStep.action) {
    case "salesTransitionOpportunity": {
      if (!actionStep.toState && !actionStep.transitionId) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "invalid_action",
          detail: "salesTransitionOpportunity requiere toState o transitionId.",
        };
      }
      const result = await input.salesOps.salesTransitionOpportunity({
        tenantId: input.tenantId,
        oportunidadId: input.oportunidadId,
        actor,
        toState: actionStep.toState,
        transitionId: actionStep.transitionId,
        comment: actionStep.comment,
      });
      if (!result.ok) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "action_failed",
          detail: result.error ?? result.reason,
        };
      }
      return {
        ok: true,
        action: actionStep.action,
        activityId: result.activity._id,
      };
    }
    case "salesRecordFollowUp": {
      if (
        (actionStep.followUpKind !== "note" &&
          actionStep.followUpKind !== "contact") ||
        !actionStep.summary?.trim()
      ) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "invalid_action",
          detail: "salesRecordFollowUp requiere followUpKind y summary.",
        };
      }
      const result = await input.salesOps.salesRecordFollowUp({
        tenantId: input.tenantId,
        oportunidadId: input.oportunidadId,
        actor,
        kind: actionStep.followUpKind,
        summary: actionStep.summary,
      });
      if (!result.ok) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "action_failed",
          detail: result.reason,
        };
      }
      return {
        ok: true,
        action: actionStep.action,
        activityId: result.activity._id,
      };
    }
    case "salesSetNextAction": {
      if (!actionStep.summary?.trim()) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "invalid_action",
          detail: "salesSetNextAction requiere summary.",
        };
      }
      const result = await input.salesOps.salesSetNextAction({
        tenantId: input.tenantId,
        oportunidadId: input.oportunidadId,
        actor,
        summary: actionStep.summary,
        dueAt: actionStep.dueAt,
        kind: actionStep.nextActionKind,
      });
      if (!result.ok) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "action_failed",
          detail: result.reason,
        };
      }
      return {
        ok: true,
        action: actionStep.action,
        activityId: result.activity._id,
      };
    }
    case "salesClearNextAction": {
      const result = await input.salesOps.salesClearNextAction({
        tenantId: input.tenantId,
        oportunidadId: input.oportunidadId,
        actor,
      });
      if (!result.ok) {
        return {
          ok: false,
          action: actionStep.action,
          reason: "action_failed",
          detail: result.reason,
        };
      }
      return {
        ok: true,
        action: actionStep.action,
        activityId: result.activity._id,
      };
    }
    default: {
      const _exhaustive: never = actionStep;
      void _exhaustive;
      return {
        ok: false,
        reason: "invalid_action",
        detail: "Acción no soportada.",
      };
    }
  }
}
