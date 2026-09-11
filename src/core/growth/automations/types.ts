/**
 * OT-GROWTH-AUTOMATION-002 / ADR-011 — definición versionada de Automatización por Espacio.
 * Persistencia versionada + runtime mínimo (AUTOMATION-003).
 */

import type { GrowthDomainEventType } from "@/core/growth/event-bus-port";
import type {
  GrowthNextActionKind,
  GrowthOpportunityStatus,
  GrowthOriginKind,
} from "@/core/growth/types";

export const GROWTH_AUTOMATIONS_COLLECTION = "growth_automations" as const;
export const GROWTH_AUTOMATION_VERSIONS_COLLECTION =
  "growth_automation_versions" as const;
/** Proyección fina de ejecuciones (OT-007). No es copia del Event Bus. */
export const GROWTH_AUTOMATION_RUNS_COLLECTION =
  "growth_automation_runs" as const;

/** Actor de sistema para ejecuciones futuras (ADR-011). No es cuenta Identity. */
export const GROWTH_AUTOMATION_SYSTEM_ACTOR = "growth-automation" as const;

export const GROWTH_AUTOMATION_ACTION_TYPES = [
  "salesTransitionOpportunity",
  "salesRecordFollowUp",
  "salesSetNextAction",
  "salesClearNextAction",
] as const;

export type GrowthAutomationActionType =
  (typeof GROWTH_AUTOMATION_ACTION_TYPES)[number];

/** Ciclo de vida de la Automatización (identidad estable). */
export type GrowthAutomationStatus = "draft" | "active" | "disabled";

/** Estado de una versión concreta. `published` es inmutable. */
export type GrowthAutomationVersionStatus = "draft" | "published";

export type GrowthAutomationTriggerStep = {
  kind: "trigger";
  eventTypes: GrowthDomainEventType[];
};

export type GrowthAutomationConditionRule =
  | {
      field: "origin.kind";
      op: "eq";
      value: GrowthOriginKind;
    }
  | {
      field: "origin.channel";
      op: "eq";
      value: string;
    }
  | {
      field: "origin.formDestination";
      op: "eq";
      value: string;
    }
  | {
      field: "status";
      op: "eq";
      value: GrowthOpportunityStatus;
    }
  | {
      field: "typeKey";
      op: "eq";
      value: string;
    }
  | {
      field: "nextAction";
      op: "exists" | "absent";
    };

export type GrowthAutomationConditionStep = {
  kind: "condition";
  rules: GrowthAutomationConditionRule[];
};

export type GrowthAutomationActionStep =
  | {
      kind: "action";
      action: "salesTransitionOpportunity";
      toState?: string;
      transitionId?: string;
      comment?: string;
    }
  | {
      kind: "action";
      action: "salesRecordFollowUp";
      followUpKind: "note" | "contact";
      summary: string;
    }
  | {
      kind: "action";
      action: "salesSetNextAction";
      summary: string;
      dueAt?: string;
      nextActionKind?: GrowthNextActionKind;
    }
  | {
      kind: "action";
      action: "salesClearNextAction";
    };

/**
 * Espera temporal antes de continuar (OT-GROWTH-AUTOMATION-005).
 * Se persiste en core_scheduled_events y se reanuda vía GrowthAutomationResume.
 */
export type GrowthAutomationWaitStep = {
  kind: "wait";
  durationMs: number;
};

export type GrowthAutomationStep =
  | GrowthAutomationTriggerStep
  | GrowthAutomationConditionStep
  | GrowthAutomationActionStep
  | GrowthAutomationWaitStep;

/** Identidad estable por Espacio. */
export interface GrowthAutomation {
  _id: string;
  tenantId: string;
  name: string;
  status: GrowthAutomationStatus;
  /** Versión publicada vigente (inmutable). */
  publishedVersion: number | null;
  /** Borrador editable actual, si existe. */
  draftVersion: number | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  updatedByUserId: string;
}

/** Versión concreta de la definición (Trigger → Condición → Acción). */
export interface GrowthAutomationVersion {
  _id: string;
  automationId: string;
  tenantId: string;
  version: number;
  status: GrowthAutomationVersionStatus;
  steps: GrowthAutomationStep[];
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  updatedByUserId: string;
  publishedAt?: string;
  publishedByUserId?: string;
}

/**
 * OT-GROWTH-AUTOMATION-007 — proyección de una ejecución para «Qué ha pasado».
 * Guarda hechos humanos + estado; no duplica payloads ni eventos del bus.
 * `attemptKey` es interno (idempotencia); no se expone en UI.
 */
export type GrowthAutomationRunStatus =
  | "in_progress"
  | "waiting"
  | "completed"
  | "needs_attention";

export type GrowthAutomationRunLine = {
  at: string;
  text: string;
};

export interface GrowthAutomationRun {
  _id: string;
  tenantId: string;
  automationId: string;
  /** Clave idempotente = sourceEventId del disparo (también en reanudación). */
  attemptKey: string;
  status: GrowthAutomationRunStatus;
  startedAt: string;
  updatedAt: string;
  /** Cuándo continúa si status=waiting (ISO). */
  scheduledFor?: string;
  /** Duración humana de la espera («2 días»), si aplica. */
  waitDurationLabel?: string;
  lines: GrowthAutomationRunLine[];
  /** Refs a actividades Growth (sin copiar su contenido). */
  activityIds?: string[];
  /** Detalle corto y seguro si needs_attention (sin stack). */
  errorDetail?: string;
}
