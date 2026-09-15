/**
 * OT-GROWTH-AUTOMATION-002 / ADR-011 — catálogo cerrado + validación server-side.
 * WAIT habilitado tras acciones cuando existe runner (OT-GROWTH-AUTOMATION-005).
 */

import { GROWTH_DOMAIN_EVENT_TYPES } from "@/core/growth/event-bus-port";
import type { GrowthDomainEventType } from "@/core/growth/event-bus-port";
import type {
  GrowthAutomationActionStep,
  GrowthAutomationConditionRule,
  GrowthAutomationStep,
  GrowthAutomationTriggerStep,
  GrowthAutomationWaitStep,
} from "./types";
import { GROWTH_AUTOMATION_ACTION_TYPES } from "./types";

const ORIGIN_KINDS = [
  "admission",
  "form",
  "event",
  "manual",
  "unknown",
] as const;

const OPPORTUNITY_STATUSES = [
  "open",
  "active",
  "won",
  "lost",
  "handed_off",
  "archived",
] as const;

const NEXT_ACTION_KINDS = [
  "contact",
  "review",
  "handoff",
  "wait",
  "other",
] as const;

/** Tope contractual de una espera (30 días). */
export const AUTOMATION_WAIT_MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type AutomationCatalogErrorCode =
  | "empty_steps"
  | "invalid_shape"
  | "missing_trigger"
  | "multiple_triggers"
  | "trigger_not_first"
  | "missing_action"
  | "missing_post_wait_action"
  | "steps_out_of_order"
  | "invalid_wait"
  | "multiple_waits"
  | "unknown_step_kind"
  | "invalid_trigger"
  | "invalid_condition"
  | "invalid_action";

export type AutomationCatalogValidation =
  | { ok: true; steps: GrowthAutomationStep[] }
  | { ok: false; code: AutomationCatalogErrorCode; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGrowthEventType(value: unknown): value is GrowthDomainEventType {
  return (
    typeof value === "string" &&
    (GROWTH_DOMAIN_EVENT_TYPES as readonly string[]).includes(value)
  );
}

function validateTrigger(
  raw: Record<string, unknown>
):
  | { ok: true; step: GrowthAutomationTriggerStep }
  | { ok: false; code: AutomationCatalogErrorCode; error: string } {
  if (!Array.isArray(raw.eventTypes) || raw.eventTypes.length === 0) {
    return {
      ok: false,
      code: "invalid_trigger",
      error: "Trigger requiere al menos un eventType Growth*.",
    };
  }
  const eventTypes: GrowthDomainEventType[] = [];
  for (const t of raw.eventTypes) {
    if (!isGrowthEventType(t)) {
      return {
        ok: false,
        code: "invalid_trigger",
        error: `Trigger fuera de catálogo ADR-011: ${String(t)}`,
      };
    }
    if (!eventTypes.includes(t)) eventTypes.push(t);
  }
  return { ok: true, step: { kind: "trigger", eventTypes } };
}

function validateConditionRule(
  raw: unknown
):
  | { ok: true; rule: GrowthAutomationConditionRule }
  | { ok: false; code: AutomationCatalogErrorCode; error: string } {
  if (!isRecord(raw) || typeof raw.field !== "string") {
    return {
      ok: false,
      code: "invalid_condition",
      error: "Condición inválida.",
    };
  }

  switch (raw.field) {
    case "origin.kind": {
      if (
        raw.op !== "eq" ||
        typeof raw.value !== "string" ||
        !(ORIGIN_KINDS as readonly string[]).includes(raw.value)
      ) {
        return {
          ok: false,
          code: "invalid_condition",
          error: "Condición origin.kind inválida o fuera de catálogo.",
        };
      }
      return {
        ok: true,
        rule: {
          field: "origin.kind",
          op: "eq",
          value: raw.value as (typeof ORIGIN_KINDS)[number],
        },
      };
    }
    case "origin.channel":
    case "origin.formDestination":
    case "origin.campaign": {
      if (raw.op !== "eq" || typeof raw.value !== "string" || !raw.value.trim()) {
        return {
          ok: false,
          code: "invalid_condition",
          error: `Condición ${raw.field} requiere op=eq y value string.`,
        };
      }
      return {
        ok: true,
        rule: {
          field: raw.field,
          op: "eq",
          value: raw.value.trim(),
        },
      };
    }
    case "status": {
      if (
        raw.op !== "eq" ||
        typeof raw.value !== "string" ||
        !(OPPORTUNITY_STATUSES as readonly string[]).includes(raw.value)
      ) {
        return {
          ok: false,
          code: "invalid_condition",
          error: "Condición status inválida o fuera de catálogo.",
        };
      }
      return {
        ok: true,
        rule: {
          field: "status",
          op: "eq",
          value: raw.value as (typeof OPPORTUNITY_STATUSES)[number],
        },
      };
    }
    case "typeKey": {
      if (raw.op !== "eq" || typeof raw.value !== "string" || !raw.value.trim()) {
        return {
          ok: false,
          code: "invalid_condition",
          error: "Condición typeKey requiere op=eq y value string.",
        };
      }
      return {
        ok: true,
        rule: { field: "typeKey", op: "eq", value: raw.value.trim() },
      };
    }
    case "nextAction": {
      if (raw.op !== "exists" && raw.op !== "absent") {
        return {
          ok: false,
          code: "invalid_condition",
          error: "Condición nextAction requiere op exists|absent.",
        };
      }
      return {
        ok: true,
        rule: { field: "nextAction", op: raw.op },
      };
    }
    default:
      return {
        ok: false,
        code: "invalid_condition",
        error: `Condición fuera de catálogo ADR-011: ${raw.field}`,
      };
  }
}

function validateAction(
  raw: Record<string, unknown>
):
  | { ok: true; step: GrowthAutomationActionStep }
  | { ok: false; code: AutomationCatalogErrorCode; error: string } {
  if (
    typeof raw.action !== "string" ||
    !(GROWTH_AUTOMATION_ACTION_TYPES as readonly string[]).includes(raw.action)
  ) {
    return {
      ok: false,
      code: "invalid_action",
      error: `Acción fuera de catálogo ADR-011: ${String(raw.action)}`,
    };
  }

  switch (raw.action) {
    case "salesTransitionOpportunity": {
      const toState =
        typeof raw.toState === "string" && raw.toState.trim()
          ? raw.toState.trim()
          : undefined;
      const transitionId =
        typeof raw.transitionId === "string" && raw.transitionId.trim()
          ? raw.transitionId.trim()
          : undefined;
      if (!toState && !transitionId) {
        return {
          ok: false,
          code: "invalid_action",
          error: "salesTransitionOpportunity requiere toState o transitionId.",
        };
      }
      const comment =
        typeof raw.comment === "string" && raw.comment.trim()
          ? raw.comment.trim()
          : undefined;
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesTransitionOpportunity",
          toState,
          transitionId,
          comment,
        },
      };
    }
    case "salesRecordFollowUp": {
      if (raw.followUpKind !== "note" && raw.followUpKind !== "contact") {
        return {
          ok: false,
          code: "invalid_action",
          error: "salesRecordFollowUp requiere followUpKind note|contact.",
        };
      }
      if (typeof raw.summary !== "string" || !raw.summary.trim()) {
        return {
          ok: false,
          code: "invalid_action",
          error: "salesRecordFollowUp requiere summary.",
        };
      }
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: raw.followUpKind,
          summary: raw.summary.trim(),
        },
      };
    }
    case "salesSetNextAction": {
      if (typeof raw.summary !== "string" || !raw.summary.trim()) {
        return {
          ok: false,
          code: "invalid_action",
          error: "salesSetNextAction requiere summary.",
        };
      }
      const nextActionKind =
        typeof raw.nextActionKind === "string" &&
        (NEXT_ACTION_KINDS as readonly string[]).includes(raw.nextActionKind)
          ? (raw.nextActionKind as (typeof NEXT_ACTION_KINDS)[number])
          : undefined;
      const dueAt =
        typeof raw.dueAt === "string" && raw.dueAt.trim()
          ? raw.dueAt.trim()
          : undefined;
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesSetNextAction",
          summary: raw.summary.trim(),
          dueAt,
          nextActionKind,
        },
      };
    }
    case "salesClearNextAction":
      return { ok: true, step: { kind: "action", action: "salesClearNextAction" } };
    default:
      return {
        ok: false,
        code: "invalid_action",
        error: `Acción fuera de catálogo ADR-011: ${raw.action}`,
      };
  }
}

function validateWait(
  raw: Record<string, unknown>
):
  | { ok: true; step: GrowthAutomationWaitStep }
  | { ok: false; code: AutomationCatalogErrorCode; error: string } {
  const durationMs = raw.durationMs;
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    !Number.isInteger(durationMs) ||
    durationMs < 1
  ) {
    return {
      ok: false,
      code: "invalid_wait",
      error: "WAIT requiere durationMs entero ≥ 1.",
    };
  }
  if (durationMs > AUTOMATION_WAIT_MAX_DURATION_MS) {
    return {
      ok: false,
      code: "invalid_wait",
      error: `WAIT no puede exceder ${AUTOMATION_WAIT_MAX_DURATION_MS}ms (30 días).`,
    };
  }
  return { ok: true, step: { kind: "wait", durationMs } };
}

/**
 * Valida y normaliza pasos: Trigger → Condición* → Acción+ → (Wait → Acción+)?
 * Una sola espera; debe haber acciones antes y después del WAIT.
 */
export function validateAutomationSteps(
  input: unknown
): AutomationCatalogValidation {
  if (!Array.isArray(input) || input.length === 0) {
    return {
      ok: false,
      code: "empty_steps",
      error: "La definición requiere pasos (Trigger → Condición → Acción).",
    };
  }

  const normalized: GrowthAutomationStep[] = [];
  let phase: "trigger" | "condition" | "action" | "wait" | "post_action" =
    "trigger";
  let triggerCount = 0;
  let actionCount = 0;
  let waitCount = 0;
  let postWaitActionCount = 0;

  for (const rawStep of input) {
    if (!isRecord(rawStep) || typeof rawStep.kind !== "string") {
      return {
        ok: false,
        code: "invalid_shape",
        error: "Cada paso debe ser un objeto con kind.",
      };
    }

    if (rawStep.kind === "wait") {
      if (phase !== "action" || actionCount < 1) {
        return {
          ok: false,
          code: "steps_out_of_order",
          error:
            "WAIT solo puede ir después de al menos una Acción (Acción → Esperar → Continuar).",
        };
      }
      if (waitCount > 0) {
        return {
          ok: false,
          code: "multiple_waits",
          error: "Solo se permite un paso WAIT por versión.",
        };
      }
      const parsed = validateWait(rawStep);
      if (!parsed.ok) return parsed;
      normalized.push(parsed.step);
      waitCount += 1;
      phase = "wait";
      continue;
    }

    if (rawStep.kind === "trigger") {
      if (phase !== "trigger" || triggerCount > 0) {
        return {
          ok: false,
          code: triggerCount > 0 ? "multiple_triggers" : "trigger_not_first",
          error: "Debe haber exactamente un Trigger al inicio.",
        };
      }
      const parsed = validateTrigger(rawStep);
      if (!parsed.ok) return parsed;
      normalized.push(parsed.step);
      triggerCount += 1;
      phase = "condition";
      continue;
    }

    if (rawStep.kind === "condition") {
      if (triggerCount === 0) {
        return {
          ok: false,
          code: "missing_trigger",
          error: "La definición debe comenzar con un Trigger.",
        };
      }
      if (phase === "action" || phase === "wait" || phase === "post_action") {
        return {
          ok: false,
          code: "steps_out_of_order",
          error: "Las Condiciones deben ir antes de las Acciones.",
        };
      }
      if (!Array.isArray(rawStep.rules) || rawStep.rules.length === 0) {
        return {
          ok: false,
          code: "invalid_condition",
          error: "Condición requiere al menos una regla del catálogo.",
        };
      }
      const rules: GrowthAutomationConditionRule[] = [];
      for (const ruleRaw of rawStep.rules) {
        const rule = validateConditionRule(ruleRaw);
        if (!rule.ok) return rule;
        rules.push(rule.rule);
      }
      normalized.push({ kind: "condition", rules });
      phase = "condition";
      continue;
    }

    if (rawStep.kind === "action") {
      if (triggerCount === 0) {
        return {
          ok: false,
          code: "missing_trigger",
          error: "La definición debe comenzar con un Trigger.",
        };
      }
      const parsed = validateAction(rawStep);
      if (!parsed.ok) return parsed;
      normalized.push(parsed.step);
      if (phase === "wait" || phase === "post_action") {
        postWaitActionCount += 1;
        phase = "post_action";
      } else {
        actionCount += 1;
        phase = "action";
      }
      continue;
    }

    return {
      ok: false,
      code: "unknown_step_kind",
      error: `Paso desconocido: ${rawStep.kind}`,
    };
  }

  if (triggerCount !== 1) {
    return {
      ok: false,
      code: "missing_trigger",
      error: "La definición debe comenzar con exactamente un Trigger.",
    };
  }
  if (actionCount < 1) {
    return {
      ok: false,
      code: "missing_action",
      error: "La definición requiere al menos una Acción sales-ops.",
    };
  }
  if (waitCount > 0 && postWaitActionCount < 1) {
    return {
      ok: false,
      code: "missing_post_wait_action",
      error: "Tras WAIT debe haber al menos una Acción de continuación.",
    };
  }

  return { ok: true, steps: normalized };
}
