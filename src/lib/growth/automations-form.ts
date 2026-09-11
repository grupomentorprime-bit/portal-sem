/**
 * OT-GROWTH-AUTOMATION-004 / 006 — formulario guiado ↔ pasos del catálogo ADR-011.
 * Solo construye definiciones que validateAutomationSteps acepta (incl. WAIT).
 */

import type { GrowthDomainEventType } from "@/core/growth/event-bus-port";
import { GROWTH_DOMAIN_EVENT_TYPES } from "@/core/growth/event-bus-port";
import { AUTOMATION_WAIT_MAX_DURATION_MS } from "@/core/growth/automations/catalog";
import type {
  GrowthAutomationActionStep,
  GrowthAutomationActionType,
  GrowthAutomationConditionRule,
  GrowthAutomationStep,
} from "@/core/growth/automations/types";
import { GROWTH_AUTOMATION_ACTION_TYPES } from "@/core/growth/automations/types";
import type {
  GrowthNextActionKind,
  GrowthOpportunityStatus,
  GrowthOriginKind,
} from "@/core/growth/types";
import type { AutomationConditionKind } from "@/lib/growth/automations-labels";
import {
  waitDurationMs,
  waitFromDurationMs,
  type AutomationWaitUnit,
} from "@/lib/growth/automations-wait-units";

export type { AutomationWaitUnit } from "@/lib/growth/automations-wait-units";
export {
  AUTOMATION_WAIT_UNIT_OPTIONS,
  waitDurationMs,
  waitFromDurationMs,
} from "@/lib/growth/automations-wait-units";

export type AutomationEditorForm = {
  name: string;
  eventType: GrowthDomainEventType | "";
  conditionEnabled: boolean;
  conditionKind: AutomationConditionKind | "";
  /** Encoded: `kind:admission` | `channel:portal-admision` */
  originValue: string;
  statusValue: GrowthOpportunityStatus | "";
  typeKey: string;
  nextActionOp: "exists" | "absent";
  actionType: GrowthAutomationActionType | "";
  nextActionSummary: string;
  nextActionKind: GrowthNextActionKind | "";
  followUpKind: "note" | "contact";
  followUpSummary: string;
  transitionToState: GrowthOpportunityStatus | "";
  /** OT-006 — Esperar entre la primera acción y la continuación. */
  waitEnabled: boolean;
  waitAmount: string;
  waitUnit: AutomationWaitUnit;
  postActionType: GrowthAutomationActionType | "";
  postNextActionSummary: string;
  postNextActionKind: GrowthNextActionKind | "";
  postFollowUpKind: "note" | "contact";
  postFollowUpSummary: string;
  postTransitionToState: GrowthOpportunityStatus | "";
};

export const EMPTY_AUTOMATION_EDITOR_FORM: AutomationEditorForm = {
  name: "",
  eventType: "",
  conditionEnabled: false,
  conditionKind: "",
  originValue: "channel:portal-admision",
  statusValue: "open",
  typeKey: "inquiry",
  nextActionOp: "absent",
  actionType: "",
  nextActionSummary: "",
  nextActionKind: "",
  followUpKind: "note",
  followUpSummary: "",
  transitionToState: "active",
  waitEnabled: false,
  waitAmount: "2",
  waitUnit: "days",
  postActionType: "",
  postNextActionSummary: "",
  postNextActionKind: "",
  postFollowUpKind: "note",
  postFollowUpSummary: "",
  postTransitionToState: "active",
};

function isEventType(value: string): value is GrowthDomainEventType {
  return (GROWTH_DOMAIN_EVENT_TYPES as readonly string[]).includes(value);
}

function isActionType(value: string): value is GrowthAutomationActionType {
  return (GROWTH_AUTOMATION_ACTION_TYPES as readonly string[]).includes(value);
}

function buildConditionRule(
  form: AutomationEditorForm
): GrowthAutomationConditionRule | null {
  if (!form.conditionEnabled || !form.conditionKind) return null;

  switch (form.conditionKind) {
    case "origin": {
      const raw = form.originValue.trim();
      if (raw.startsWith("kind:")) {
        const value = raw.slice("kind:".length) as GrowthOriginKind;
        return { field: "origin.kind", op: "eq", value };
      }
      if (raw.startsWith("channel:")) {
        const value = raw.slice("channel:".length);
        if (!value) return null;
        return { field: "origin.channel", op: "eq", value };
      }
      return null;
    }
    case "status": {
      if (!form.statusValue) return null;
      return { field: "status", op: "eq", value: form.statusValue };
    }
    case "typeKey": {
      const typeKey = form.typeKey.trim();
      if (!typeKey) return null;
      return { field: "typeKey", op: "eq", value: typeKey };
    }
    case "nextAction":
      return { field: "nextAction", op: form.nextActionOp };
    default:
      return null;
  }
}

type ActionFields = {
  actionType: GrowthAutomationActionType | "";
  nextActionSummary: string;
  nextActionKind: GrowthNextActionKind | "";
  followUpKind: "note" | "contact";
  followUpSummary: string;
  transitionToState: GrowthOpportunityStatus | "";
};

function buildActionStep(
  fields: ActionFields,
  emptySummaryError: string,
  emptyFollowUpError: string,
  emptyTransitionError: string
):
  | { ok: true; step: GrowthAutomationActionStep }
  | { ok: false; error: string } {
  if (!fields.actionType || !isActionType(fields.actionType)) {
    return { ok: false, error: "Elige qué debe hacer." };
  }

  switch (fields.actionType) {
    case "salesSetNextAction": {
      const summary = fields.nextActionSummary.trim();
      if (!summary) {
        return { ok: false, error: emptySummaryError };
      }
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesSetNextAction",
          summary,
          ...(fields.nextActionKind
            ? { nextActionKind: fields.nextActionKind }
            : {}),
        },
      };
    }
    case "salesClearNextAction":
      return { ok: true, step: { kind: "action", action: "salesClearNextAction" } };
    case "salesRecordFollowUp": {
      const summary = fields.followUpSummary.trim();
      if (!summary) {
        return { ok: false, error: emptyFollowUpError };
      }
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: fields.followUpKind,
          summary,
        },
      };
    }
    case "salesTransitionOpportunity": {
      if (!fields.transitionToState) {
        return { ok: false, error: emptyTransitionError };
      }
      return {
        ok: true,
        step: {
          kind: "action",
          action: "salesTransitionOpportunity",
          toState: fields.transitionToState,
        },
      };
    }
    default:
      return { ok: false, error: "Acción no soportada." };
  }
}

function applyActionToForm(
  form: AutomationEditorForm,
  step: GrowthAutomationActionStep,
  target: "pre" | "post"
) {
  if (target === "pre") {
    form.actionType = step.action;
    if (step.action === "salesSetNextAction") {
      form.nextActionSummary = step.summary;
      form.nextActionKind = step.nextActionKind ?? "";
    }
    if (step.action === "salesRecordFollowUp") {
      form.followUpKind = step.followUpKind;
      form.followUpSummary = step.summary;
    }
    if (step.action === "salesTransitionOpportunity" && step.toState) {
      form.transitionToState = step.toState as GrowthOpportunityStatus;
    }
    return;
  }

  form.postActionType = step.action;
  if (step.action === "salesSetNextAction") {
    form.postNextActionSummary = step.summary;
    form.postNextActionKind = step.nextActionKind ?? "";
  }
  if (step.action === "salesRecordFollowUp") {
    form.postFollowUpKind = step.followUpKind;
    form.postFollowUpSummary = step.summary;
  }
  if (step.action === "salesTransitionOpportunity" && step.toState) {
    form.postTransitionToState = step.toState as GrowthOpportunityStatus;
  }
}

export type BuildAutomationStepsResult =
  | { ok: true; steps: GrowthAutomationStep[] }
  | { ok: false; error: string };

/** Construye Trigger → Condición? → Acción → (Esperar → Acción)? del catálogo. */
export function buildAutomationStepsFromForm(
  form: AutomationEditorForm
): BuildAutomationStepsResult {
  if (!form.eventType || !isEventType(form.eventType)) {
    return { ok: false, error: "Elige cuándo debe activarse." };
  }

  const first = buildActionStep(
    {
      actionType: form.actionType,
      nextActionSummary: form.nextActionSummary,
      nextActionKind: form.nextActionKind,
      followUpKind: form.followUpKind,
      followUpSummary: form.followUpSummary,
      transitionToState: form.transitionToState,
    },
    "Escribe qué hacer ahora.",
    "Escribe el detalle del seguimiento.",
    "Elige el estado de destino."
  );
  if (!first.ok) return first;

  const steps: GrowthAutomationStep[] = [
    { kind: "trigger", eventTypes: [form.eventType] },
  ];

  if (form.conditionEnabled) {
    const rule = buildConditionRule(form);
    if (!rule) {
      return { ok: false, error: "Completa la condición o quítala." };
    }
    steps.push({ kind: "condition", rules: [rule] });
  }

  steps.push(first.step);

  if (form.waitEnabled) {
    const amount = Number.parseInt(form.waitAmount.trim(), 10);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
      return {
        ok: false,
        error: "Indica cuánto tiempo esperar (número entero mayor que 0).",
      };
    }
    const durationMs = waitDurationMs(amount, form.waitUnit);
    if (durationMs > AUTOMATION_WAIT_MAX_DURATION_MS) {
      return {
        ok: false,
        error: "La espera no puede superar 30 días.",
      };
    }

    steps.push({ kind: "wait", durationMs });

    const after = buildActionStep(
      {
        actionType: form.postActionType,
        nextActionSummary: form.postNextActionSummary,
        nextActionKind: form.postNextActionKind,
        followUpKind: form.postFollowUpKind,
        followUpSummary: form.postFollowUpSummary,
        transitionToState: form.postTransitionToState,
      },
      "Escribe qué hacer después de la espera.",
      "Escribe el detalle del seguimiento posterior.",
      "Elige el estado de destino después de la espera."
    );
    if (!after.ok) {
      if (after.error === "Elige qué debe hacer.") {
        return {
          ok: false,
          error: "Después de esperar, elige qué hacer.",
        };
      }
      return after;
    }
    steps.push(after.step);
  }

  return { ok: true, steps };
}

/** Hidrata el formulario desde pasos ya validados. */
export function automationFormFromSteps(
  name: string,
  steps: GrowthAutomationStep[]
): AutomationEditorForm {
  const form: AutomationEditorForm = {
    ...EMPTY_AUTOMATION_EDITOR_FORM,
    name,
  };

  let phase: "pre" | "post" = "pre";

  for (const step of steps) {
    if (step.kind === "trigger" && step.eventTypes[0]) {
      form.eventType = step.eventTypes[0];
    }
    if (step.kind === "condition" && step.rules[0]) {
      form.conditionEnabled = true;
      const rule = step.rules[0];
      switch (rule.field) {
        case "origin.kind":
          form.conditionKind = "origin";
          form.originValue = `kind:${rule.value}`;
          break;
        case "origin.channel":
          form.conditionKind = "origin";
          form.originValue = `channel:${rule.value}`;
          break;
        case "origin.formDestination":
          form.conditionKind = "origin";
          form.originValue = `channel:${rule.value}`;
          break;
        case "status":
          form.conditionKind = "status";
          form.statusValue = rule.value;
          break;
        case "typeKey":
          form.conditionKind = "typeKey";
          form.typeKey = rule.value;
          break;
        case "nextAction":
          form.conditionKind = "nextAction";
          form.nextActionOp = rule.op;
          break;
      }
    }
    if (step.kind === "wait") {
      form.waitEnabled = true;
      const parsed = waitFromDurationMs(step.durationMs);
      form.waitAmount = parsed.amount;
      form.waitUnit = parsed.unit;
      phase = "post";
    }
    if (step.kind === "action") {
      applyActionToForm(form, step, phase);
    }
  }

  return form;
}
