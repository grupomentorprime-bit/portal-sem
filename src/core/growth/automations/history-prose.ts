/**
 * OT-GROWTH-AUTOMATION-007 — prosa humana para historial de ejecuciones.
 * Sin eventId, resumeKey, automationId, version, claims ni payloads.
 */

import type { GrowthDomainEventType } from "@/core/growth/event-bus-port";
import type {
  GrowthAutomationActionStep,
  GrowthAutomationWaitStep,
} from "./types";

const TRIGGER_PAST: Partial<Record<GrowthDomainEventType, string>> = {
  GrowthOpportunityOpened: "Se creó una oportunidad.",
  GrowthPersonaUpserted: "Se actualizó una persona.",
  GrowthOpportunityTransitioned: "Cambió el estado de una oportunidad.",
  GrowthActivityRecorded: "Se registró una actividad.",
  GrowthNextActionSet: "Se definió qué hacer ahora.",
  GrowthHandoffRecorded: "Se registró un traspaso.",
  GrowthMessageReceived: "Se recibió un mensaje.",
  GrowthMessageSent: "Se envió un mensaje.",
};

const WAIT_UNIT: Record<"minutes" | "hours" | "days", { one: string; many: string }> =
  {
    minutes: { one: "minuto", many: "minutos" },
    hours: { one: "hora", many: "horas" },
    days: { one: "día", many: "días" },
  };

const MS = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
} as const;

export const AUTOMATION_HISTORY_FAILED_LINE =
  "No se pudo completar esta acción." as const;

export const AUTOMATION_HISTORY_COMPLETED_LINE =
  "Terminó correctamente." as const;

export function automationTriggerPastLabel(eventType: string): string | null {
  const known = TRIGGER_PAST[eventType as GrowthDomainEventType];
  return known ?? null;
}

export function automationWaitDurationLabel(
  step: GrowthAutomationWaitStep
): string {
  const ms = step.durationMs;
  let amount: number;
  let unit: keyof typeof WAIT_UNIT;
  if (ms % MS.days === 0) {
    amount = ms / MS.days;
    unit = "days";
  } else if (ms % MS.hours === 0) {
    amount = ms / MS.hours;
    unit = "hours";
  } else {
    amount = Math.max(1, Math.round(ms / MS.minutes));
    unit = "minutes";
  }
  const labels = WAIT_UNIT[unit];
  return `${amount} ${amount === 1 ? labels.one : labels.many}`;
}

export function automationActionPastLine(
  step: GrowthAutomationActionStep
): string {
  switch (step.action) {
    case "salesSetNextAction":
      return `Definió qué hacer ahora: “${step.summary.trim()}”.`;
    case "salesRecordFollowUp":
      return `Registró el seguimiento “${step.summary.trim()}”.`;
    case "salesClearNextAction":
      return "Quitó qué hacer ahora.";
    case "salesTransitionOpportunity": {
      if (step.toState) {
        return `Cambió el estado de la oportunidad a «${step.toState}».`;
      }
      return "Cambió el estado de la oportunidad.";
    }
    default: {
      const _exhaustive: never = step;
      void _exhaustive;
      return "Hizo una acción.";
    }
  }
}

export function automationWaitingLines(input: {
  waitDurationLabel: string;
  scheduledFor: string;
  at: string;
}): Array<{ at: string; text: string }> {
  const continueDate = formatContinueDate(input.scheduledFor);
  return [
    {
      at: input.at,
      text: `Está esperando ${input.waitDurationLabel}.`,
    },
    {
      at: input.at,
      text: `Continuará el ${continueDate}.`,
    },
  ];
}

/** «Hoy, 10:32» o «6 sep, 16:20». */
export function formatAutomationRunWhen(
  iso: string,
  now: Date = new Date()
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `Hoy, ${time}`;
  const dayMonth = d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  return `${dayMonth}, ${time}`;
}

function formatContinueDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
}

/**
 * Recorte seguro para UI: sin stacks, sin claves técnicas conocidas.
 */
export function sanitizeAutomationErrorDetail(
  detail: string | undefined
): string | undefined {
  if (!detail?.trim()) return undefined;
  let text = detail.trim().split("\n")[0]?.trim() ?? "";
  text = text.replace(/\s+at\s+\S+.*/i, "").trim();
  if (
    /resumeKey|eventId|automationId|sourceEventId|stack|payload/i.test(text)
  ) {
    return undefined;
  }
  if (text.length > 180) text = `${text.slice(0, 177)}…`;
  return text || undefined;
}
