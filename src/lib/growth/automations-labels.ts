/**
 * OT-GROWTH-AUTOMATION-004 — proyección técnica → humana para Automatizaciones.
 * Reutilizable desde listado, editor y resumen. Sin jerga de runtime/bus/JSON.
 */

import { GROWTH_DOMAIN_EVENT_TYPES } from "@/core/growth/event-bus-port";
import type { GrowthDomainEventType } from "@/core/growth/event-bus-port";
import type {
  GrowthAutomationActionStep,
  GrowthAutomationActionType,
  GrowthAutomationConditionRule,
  GrowthAutomationStatus,
  GrowthAutomationStep,
  GrowthAutomationWaitStep,
} from "@/core/growth/automations/types";
import {
  waitFromDurationMs,
  type AutomationWaitUnit,
} from "@/lib/growth/automations-wait-units";
import {
  growthNextActionKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginKindLabel,
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
} from "@/lib/growth/labels";
import { humanizeOriginDisplayLabel } from "@/lib/growth/humanize-origin-display";
import type { GrowthOriginKind } from "@/core/growth/types";

const EVENT_LABELS: Record<GrowthDomainEventType, string> = {
  GrowthPersonaUpserted: "Se cree o actualice una persona",
  GrowthOpportunityOpened: "Se cree una oportunidad",
  GrowthOpportunityTransitioned: "Cambie el estado de una oportunidad",
  GrowthActivityRecorded: "Se registre una actividad",
  GrowthNextActionSet: `Se defina «${GROWTH_NEXT_ACTION_SECTION_LABEL}»`,
  GrowthHandoffRecorded: "Se registre un traspaso",
  GrowthMessageReceived: "Se reciba un mensaje",
  GrowthMessageSent: "Se envíe un mensaje",
};

const ACTION_LABELS: Record<GrowthAutomationActionType, string> = {
  salesSetNextAction: `Definir ${GROWTH_NEXT_ACTION_SECTION_LABEL.toLowerCase()}`,
  salesClearNextAction: `Quitar ${GROWTH_NEXT_ACTION_SECTION_LABEL.toLowerCase()}`,
  salesRecordFollowUp: "Registrar seguimiento",
  salesTransitionOpportunity: "Cambiar el estado de la oportunidad",
};

const STATUS_LABELS: Record<GrowthAutomationStatus, string> = {
  draft: "Borrador",
  active: "Activa",
  disabled: "Desactivada",
};

/** Canales de origen frecuentes (valor persistido → etiqueta humana). */
export const AUTOMATION_ORIGIN_CHANNEL_OPTIONS = [
  { value: "portal-admision", label: humanizeOriginDisplayLabel("portal-admision") },
  { value: "contact", label: humanizeOriginDisplayLabel("contact") },
  { value: "information_request", label: humanizeOriginDisplayLabel("information_request") },
  { value: "event_registration", label: humanizeOriginDisplayLabel("event_registration") },
] as const;

export const AUTOMATION_ORIGIN_KIND_OPTIONS = (
  ["admission", "form", "event", "manual", "unknown"] as const
).map((value) => ({
  value,
  label: growthOriginKindLabel(value),
}));

export const AUTOMATION_EVENT_OPTIONS = GROWTH_DOMAIN_EVENT_TYPES.map((value) => ({
  value,
  label: EVENT_LABELS[value],
}));

export const AUTOMATION_ACTION_OPTIONS: Array<{
  value: GrowthAutomationActionType;
  label: string;
}> = [
  { value: "salesSetNextAction", label: ACTION_LABELS.salesSetNextAction },
  { value: "salesClearNextAction", label: ACTION_LABELS.salesClearNextAction },
  { value: "salesRecordFollowUp", label: ACTION_LABELS.salesRecordFollowUp },
  {
    value: "salesTransitionOpportunity",
    label: ACTION_LABELS.salesTransitionOpportunity,
  },
];

export const AUTOMATION_CONDITION_KIND_OPTIONS = [
  { value: "origin", label: "Origen" },
  { value: "status", label: "Estado" },
  { value: "typeKey", label: "Tipo de oportunidad" },
  { value: "nextAction", label: GROWTH_NEXT_ACTION_SECTION_LABEL },
] as const;

export type AutomationConditionKind =
  (typeof AUTOMATION_CONDITION_KIND_OPTIONS)[number]["value"];

export const AUTOMATION_STATUS_FILTER_OPTIONS =
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS;

export const AUTOMATION_TYPE_FILTER_OPTIONS =
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS;

export const AUTOMATION_PAGE_TITLE = "Automatizaciones";
export const AUTOMATION_PAGE_DESCRIPTION =
  "Tareas que se hacen solas cuando pasa algo en tu negocio.";
export const AUTOMATION_EMPTY_TITLE =
  "Las automatizaciones hacen tareas por ti cuando pasa algo en tu negocio.";
export const AUTOMATION_EMPTY_DESCRIPTION =
  "Crea la primera para definir qué debe ocurrir automáticamente.";
export const AUTOMATION_CREATE_CTA = "Crear automatización";
export const AUTOMATION_ACTIVATE_CTA = "Activar automatización";
export const AUTOMATION_SAVE_DRAFT_CTA = "Guardar borrador";
export const AUTOMATION_REVIEW_CTA = "Revisar y activar";
export const AUTOMATION_DEACTIVATE_CTA = "Desactivar";
export const AUTOMATION_EDIT_CTA = "Editar";
export const AUTOMATION_WAIT_TOGGLE_LABEL = "Después, esperar";
export const AUTOMATION_WAIT_BLOCK_TITLE = "Esperar";
export const AUTOMATION_WAIT_BLOCK_DESCRIPTION =
  "Pausa el flujo y continúa más tarde.";
export const AUTOMATION_AFTER_WAIT_TITLE = "Después, hacer esto";
export const AUTOMATION_AFTER_WAIT_DESCRIPTION =
  "Qué ocurre cuando termina la espera.";

/** OT-007 — sección de ejecuciones recientes. */
export const AUTOMATION_HISTORY_SECTION_TITLE = "Qué ha pasado";
export const AUTOMATION_HISTORY_SECTION_DESCRIPTION =
  "Ejecuciones recientes de esta automatización.";
export const AUTOMATION_HISTORY_EMPTY_TITLE = "Todavía no hay ejecuciones";
export const AUTOMATION_HISTORY_EMPTY_DESCRIPTION =
  "Cuando se active, verás aquí qué hizo y cómo terminó.";
export const AUTOMATION_HISTORY_MORE_DETAIL = "Ver un poco más";

export const AUTOMATION_RUN_STATUS_LABELS = {
  in_progress: "En curso",
  waiting: "Esperando",
  completed: "Terminada",
  needs_attention: "Necesita atención",
} as const;

export function automationRunStatusTone(
  status: keyof typeof AUTOMATION_RUN_STATUS_LABELS | string
): "info" | "pending" | "active" | "error" {
  if (status === "waiting" || status === "in_progress") return "pending";
  if (status === "completed") return "active";
  if (status === "needs_attention") return "error";
  return "info";
}

const WAIT_UNIT_LABELS: Record<AutomationWaitUnit, { one: string; many: string }> =
  {
    minutes: { one: "minuto", many: "minutos" },
    hours: { one: "hora", many: "horas" },
    days: { one: "día", many: "días" },
  };

/**
 * Nombre visible: quita marcadores técnicos entre corchetes al inicio
 * (p. ej. tags de captura/ops). No muta el valor persistido.
 * Vacío si solo había marcadores.
 */
export function automationDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^(\[[^\]]+\]\s*)+/u, "").trim();
}

export function automationStatusLabel(
  status: GrowthAutomationStatus | string
): string {
  return STATUS_LABELS[status as GrowthAutomationStatus] ?? status;
}

export function automationEventLabel(
  eventType: GrowthDomainEventType | string
): string {
  return (
    EVENT_LABELS[eventType as GrowthDomainEventType] ?? "Pase algo en el negocio"
  );
}

export function automationActionTypeLabel(
  action: GrowthAutomationActionType | string
): string {
  return (
    ACTION_LABELS[action as GrowthAutomationActionType] ?? "Hacer una acción"
  );
}

export function automationStatusTone(
  status: GrowthAutomationStatus | string
): "info" | "active" | "inactive" {
  if (status === "active") return "active";
  if (status === "disabled") return "inactive";
  return "info";
}

function formatOriginChannel(value: string): string {
  return humanizeOriginDisplayLabel(value);
}

function formatOriginKind(value: GrowthOriginKind | string): string {
  return growthOriginKindLabel(value);
}

/** Valor de condición → texto humano. */
export function automationConditionRuleLabel(
  rule: GrowthAutomationConditionRule
): string {
  switch (rule.field) {
    case "origin.kind":
      return `el origen es ${formatOriginKind(rule.value)}`;
    case "origin.channel":
      return `viene desde ${formatOriginChannel(rule.value)}`;
    case "origin.formDestination":
      return `el destino del formulario es ${formatOriginChannel(rule.value)}`;
    case "status":
      return `el estado es «${growthOpportunityStatusLabel(rule.value)}»`;
    case "typeKey":
      return `el tipo es «${growthOpportunityTypeLabel(rule.value)}»`;
    case "nextAction":
      return rule.op === "exists"
        ? `tiene «${GROWTH_NEXT_ACTION_SECTION_LABEL}»`
        : `no tiene «${GROWTH_NEXT_ACTION_SECTION_LABEL}»`;
    default: {
      const _exhaustive: never = rule;
      void _exhaustive;
      return "se cumple una condición";
    }
  }
}

export function automationActionStepLabel(
  step: GrowthAutomationActionStep
): string {
  switch (step.action) {
    case "salesSetNextAction": {
      const kind = step.nextActionKind
        ? ` (${growthNextActionKindLabel(step.nextActionKind)})`
        : "";
      return `${ACTION_LABELS.salesSetNextAction}${kind}:\n${step.summary}`;
    }
    case "salesClearNextAction":
      return ACTION_LABELS.salesClearNextAction;
    case "salesRecordFollowUp": {
      const kind =
        step.followUpKind === "contact" ? "Contacto" : "Nota";
      return `${ACTION_LABELS.salesRecordFollowUp} (${kind}):\n${step.summary}`;
    }
    case "salesTransitionOpportunity": {
      const state = step.toState
        ? growthOpportunityStatusLabel(step.toState)
        : "estado indicado";
      return `${ACTION_LABELS.salesTransitionOpportunity}:\n${state}`;
    }
    default: {
      const _exhaustive: never = step;
      void _exhaustive;
      return "Hacer una acción";
    }
  }
}

function findTrigger(steps: GrowthAutomationStep[]) {
  return steps.find((s) => s.kind === "trigger");
}

function findConditions(steps: GrowthAutomationStep[]) {
  return steps.filter((s) => s.kind === "condition");
}

function splitActionsAroundWait(steps: GrowthAutomationStep[]): {
  before: GrowthAutomationActionStep[];
  wait: GrowthAutomationWaitStep | null;
  after: GrowthAutomationActionStep[];
} {
  const before: GrowthAutomationActionStep[] = [];
  const after: GrowthAutomationActionStep[] = [];
  let wait: GrowthAutomationWaitStep | null = null;
  let seenWait = false;
  for (const step of steps) {
    if (step.kind === "wait") {
      wait = step;
      seenWait = true;
      continue;
    }
    if (step.kind !== "action") continue;
    if (seenWait) after.push(step);
    else before.push(step);
  }
  return { before, wait, after };
}

/** «Esperar 2 días» — sin milisegundos ni nombres técnicos. */
export function automationWaitStepLabel(
  step: GrowthAutomationWaitStep
): string {
  const { amount, unit } = waitFromDurationMs(step.durationMs);
  const n = Number.parseInt(amount, 10);
  const labels = WAIT_UNIT_LABELS[unit];
  const unitLabel = n === 1 ? labels.one : labels.many;
  return `Esperar ${amount} ${unitLabel}`;
}

/** «Cuando pase esto…» */
export function automationWhenLabel(steps: GrowthAutomationStep[]): string {
  const trigger = findTrigger(steps);
  if (!trigger || trigger.kind !== "trigger" || trigger.eventTypes.length === 0) {
    return "Cuando pase algo en el negocio";
  }
  const labels = trigger.eventTypes.map(automationEventLabel);
  if (labels.length === 1) return `Cuando ${labels[0].toLowerCase()}`;
  return `Cuando ${labels.map((l) => l.toLowerCase()).join(" o ")}`;
}

/** «Si se cumple esto…» (opcional). */
export function automationIfLabel(
  steps: GrowthAutomationStep[]
): string | null {
  const conditions = findConditions(steps);
  if (conditions.length === 0) return null;
  const parts: string[] = [];
  for (const step of conditions) {
    if (step.kind !== "condition") continue;
    for (const rule of step.rules) {
      parts.push(automationConditionRuleLabel(rule));
    }
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return `Si ${parts[0]}`;
  return `Si ${parts.join(" y ")}`;
}

/** «Hacer esto…» (acciones previas a la espera, o todas si no hay espera). */
export function automationThenLabel(steps: GrowthAutomationStep[]): string {
  const { before, wait, after } = splitActionsAroundWait(steps);
  const primary = wait ? before : [...before, ...after];
  if (primary.length === 0) return "Hacer una acción";
  return primary.map(automationActionStepLabel).join("\n");
}

export type AutomationNaturalSummary = {
  when: string;
  if: string | null;
  then: string;
  wait: string | null;
  after: string | null;
};

export function automationNaturalSummary(
  steps: GrowthAutomationStep[]
): AutomationNaturalSummary {
  const { wait, after } = splitActionsAroundWait(steps);
  return {
    when: automationWhenLabel(steps),
    if: automationIfLabel(steps),
    then: automationThenLabel(steps),
    wait: wait ? automationWaitStepLabel(wait) : null,
    after:
      wait && after.length > 0
        ? after.map(automationActionStepLabel).join("\n")
        : null,
  };
}

/**
 * Resumen continuo antes de activar (lenguaje cotidiano).
 * Ej.: «Cuando se cree una oportunidad, definir qué hacer ahora.
 * Después, esperar 2 días y registrar un seguimiento.»
 */
export function automationNaturalProse(steps: GrowthAutomationStep[]): string {
  const summary = automationNaturalSummary(steps);
  const thenHeadline = actionProseHeadline(summary.then);
  const leadParts = [summary.when];
  if (summary.if) leadParts.push(summary.if.toLowerCase());
  leadParts.push(thenHeadline);
  const lead = `${leadParts[0]}, ${leadParts.slice(1).join(", ")}.`;

  if (!summary.wait || !summary.after) {
    return lead;
  }

  const afterHeadline = actionProseHeadline(summary.after);
  return `${lead}\nDespués, ${summary.wait.toLowerCase()} y ${afterHeadline}.`;
}

/** Primera línea de la acción, en minúsculas, sin detalle multilínea. */
function actionProseHeadline(thenBlock: string): string {
  const firstLine = thenBlock.split("\n")[0]?.trim() ?? thenBlock;
  const withoutKind = firstLine.replace(/\s*\([^)]*\)\s*:?/g, "").trim();
  const base = withoutKind.replace(/:\s*$/, "").trim();
  return base.toLowerCase();
}

/** Texto corto para columnas del listado. */
export function automationListWhenShort(steps: GrowthAutomationStep[]): string {
  const trigger = findTrigger(steps);
  if (!trigger || trigger.kind !== "trigger" || trigger.eventTypes.length === 0) {
    return "—";
  }
  return trigger.eventTypes.map(automationEventLabel).join(", ");
}

function actionListShort(step: GrowthAutomationActionStep): string {
  if (step.action === "salesSetNextAction") {
    return `${ACTION_LABELS.salesSetNextAction}: ${step.summary}`;
  }
  if (step.action === "salesRecordFollowUp") {
    return `${ACTION_LABELS.salesRecordFollowUp}: ${step.summary}`;
  }
  if (step.action === "salesTransitionOpportunity") {
    const state = step.toState
      ? growthOpportunityStatusLabel(step.toState)
      : "cambiar estado";
    return `${ACTION_LABELS.salesTransitionOpportunity}: ${state}`;
  }
  return ACTION_LABELS.salesClearNextAction;
}

export function automationListThenShort(steps: GrowthAutomationStep[]): string {
  const { before, wait, after } = splitActionsAroundWait(steps);
  const first = before[0];
  if (!first) return "—";
  const head = actionListShort(first);
  if (!wait) return head;
  const tail = after[0] ? actionListShort(after[0]) : null;
  return tail
    ? `${head} · ${automationWaitStepLabel(wait)} · ${tail}`
    : `${head} · ${automationWaitStepLabel(wait)}`;
}
