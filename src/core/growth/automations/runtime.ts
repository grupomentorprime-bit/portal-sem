/**
 * OT-GROWTH-AUTOMATION-003/005 — runtime:
 * Event Bus → Automatización active → Condiciones → Acción → (WAIT → reanudación) → Resultado.
 *
 * Fail-soft en triggers Growth*: un fallo no lanza ni rompe el publish origen.
 * Reanudación (GrowthAutomationResume): propaga fallo al flush para reintento.
 */

import {
  GROWTH_DOMAIN_EVENT_TYPES,
  type GrowthDomainEventType,
} from "@/core/growth/event-bus-port";
import type { GrowthOportunidad } from "@/core/growth/types";
import type { GrowthOpportunityStore } from "@/core/growth/opportunity-store";
import { evaluateAutomationConditionRules } from "./conditions";
import { executeAutomationActionStep } from "./execute-action";
import {
  checkAutomationReentrancy,
  claimAutomationAttempt,
  releaseAutomationAttempt,
  runWithAutomationChain,
} from "./reentrancy";
import type {
  GrowthAutomationRunRecorder,
  RecordAutomationRunPhaseInput,
} from "./run-history";
import type { GrowthAutomationSalesOpsPort } from "./sales-ops-port";
import type { GrowthAutomationStore } from "./store";
import type {
  GrowthAutomation,
  GrowthAutomationActionStep,
  GrowthAutomationConditionStep,
  GrowthAutomationTriggerStep,
  GrowthAutomationVersion,
  GrowthAutomationWaitStep,
} from "./types";
import { GROWTH_AUTOMATION_SYSTEM_ACTOR } from "./types";
import {
  GROWTH_AUTOMATION_RESUME_EVENT,
  isGrowthAutomationResumePayload,
  scheduleAutomationWait,
  type GrowthAutomationSchedulePort,
} from "./wait";

export type GrowthAutomationEventInput = {
  id: string;
  type: string;
  tenantId: string;
  payload?: Record<string, unknown>;
  userId?: string;
  correlationId?: string;
  causationId?: string;
};

export type GrowthAutomationRuntimeDeps = {
  automationStore: GrowthAutomationStore;
  opportunityStore: Pick<GrowthOpportunityStore, "findById">;
  salesOps: GrowthAutomationSalesOpsPort;
  /** Requerido para Automatizaciones con WAIT. */
  schedule?: GrowthAutomationSchedulePort;
  /** OT-007 — proyección fina «Qué ha pasado» (opcional; fail-soft). */
  runRecorder?: GrowthAutomationRunRecorder;
};

export type AutomationAttemptOutcome =
  | {
      status: "executed";
      automationId: string;
      version: number;
      actions: Array<{ action: string; activityId?: string }>;
    }
  | {
      status: "waiting";
      automationId: string;
      version: number;
      scheduledId: string;
      resumeKey: string;
      scheduledFor: string;
      actions: Array<{ action: string; activityId?: string }>;
    }
  | {
      status: "resumed";
      automationId: string;
      version: number;
      resumeKey: string;
      sourceEventId: string;
      actions: Array<{ action: string; activityId?: string }>;
    }
  | {
      status:
        | "skipped_trigger"
        | "skipped_inactive"
        | "skipped_no_published"
        | "skipped_condition"
        | "skipped_no_opportunity"
        | "skipped_reentrant"
        | "skipped_duplicate"
        | "skipped_max_depth"
        | "skipped_tenant"
        | "skipped_invalid_action"
        | "skipped_no_schedule"
        | "skipped_resume"
        | "action_failed"
        | "error";
      automationId: string;
      version?: number;
      detail?: string;
    };

export type GrowthAutomationHandleResult = {
  tenantId: string;
  eventId: string;
  eventType: string;
  outcomes: AutomationAttemptOutcome[];
};

function isGrowthDomainEventType(type: string): type is GrowthDomainEventType {
  return (GROWTH_DOMAIN_EVENT_TYPES as readonly string[]).includes(type);
}

function resolveOportunidadId(
  event: GrowthAutomationEventInput
): string | null {
  const raw = event.payload?.oportunidadId;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function parseSteps(version: GrowthAutomationVersion): {
  trigger: GrowthAutomationTriggerStep | null;
  conditions: GrowthAutomationConditionStep[];
  preWaitActions: GrowthAutomationActionStep[];
  wait: GrowthAutomationWaitStep | null;
  waitStepIndex: number;
  postWaitActions: GrowthAutomationActionStep[];
} {
  let trigger: GrowthAutomationTriggerStep | null = null;
  const conditions: GrowthAutomationConditionStep[] = [];
  const preWaitActions: GrowthAutomationActionStep[] = [];
  let wait: GrowthAutomationWaitStep | null = null;
  let waitStepIndex = -1;
  const postWaitActions: GrowthAutomationActionStep[] = [];
  let seenWait = false;

  version.steps.forEach((step, index) => {
    if (step.kind === "trigger") trigger = step;
    else if (step.kind === "condition") conditions.push(step);
    else if (step.kind === "wait") {
      wait = step;
      waitStepIndex = index;
      seenWait = true;
    } else if (step.kind === "action") {
      if (seenWait) postWaitActions.push(step);
      else preWaitActions.push(step);
    }
  });

  return {
    trigger,
    conditions,
    preWaitActions,
    wait,
    waitStepIndex,
    postWaitActions,
  };
}

async function executeActionList(input: {
  tenantId: string;
  oportunidadId: string;
  actions: GrowthAutomationActionStep[];
  salesOps: GrowthAutomationSalesOpsPort;
  automationId: string;
  version: number;
}): Promise<
  | {
      ok: true;
      executed: Array<{ action: string; activityId?: string }>;
      steps: GrowthAutomationActionStep[];
      activityIds: string[];
    }
  | {
      ok: false;
      outcome: AutomationAttemptOutcome;
      steps: GrowthAutomationActionStep[];
      activityIds: string[];
    }
> {
  const executed: Array<{ action: string; activityId?: string }> = [];
  const steps: GrowthAutomationActionStep[] = [];
  const activityIds: string[] = [];
  for (const actionStep of input.actions) {
    const result = await executeAutomationActionStep({
      tenantId: input.tenantId,
      oportunidadId: input.oportunidadId,
      step: actionStep,
      salesOps: input.salesOps,
    });
    if (!result.ok) {
      return {
        ok: false,
        outcome: {
          status:
            result.reason === "invalid_action"
              ? "skipped_invalid_action"
              : "action_failed",
          automationId: input.automationId,
          version: input.version,
          detail: result.detail,
        },
        steps,
        activityIds,
      };
    }
    executed.push({
      action: result.action,
      activityId: result.activityId,
    });
    steps.push(actionStep);
    if (result.activityId) activityIds.push(result.activityId);
  }
  return { ok: true, executed, steps, activityIds };
}

/** Historial fail-soft: un fallo de proyección no rompe la ejecución. */
async function recordRunSafe(
  recorder: GrowthAutomationRunRecorder | undefined,
  input: RecordAutomationRunPhaseInput
): Promise<void> {
  if (!recorder) return;
  try {
    await recorder.recordPhase(input);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[growth.automations] run history error", message);
    }
  }
}

async function runOneAutomation(input: {
  automation: GrowthAutomation;
  event: GrowthAutomationEventInput;
  deps: GrowthAutomationRuntimeDeps;
  oportunidad: GrowthOportunidad | null;
  oportunidadId: string | null;
}): Promise<AutomationAttemptOutcome> {
  const { automation, event, deps } = input;

  if (automation.tenantId !== event.tenantId) {
    return {
      status: "skipped_tenant",
      automationId: automation._id,
      detail: "tenantId del evento no coincide con la Automatización.",
    };
  }

  if (automation.status !== "active") {
    return {
      status: "skipped_inactive",
      automationId: automation._id,
      detail: `status=${automation.status}`,
    };
  }

  if (automation.publishedVersion == null) {
    return {
      status: "skipped_no_published",
      automationId: automation._id,
    };
  }

  const version = await deps.automationStore.findVersion(
    event.tenantId,
    automation._id,
    automation.publishedVersion
  );
  if (
    !version ||
    version.tenantId !== event.tenantId ||
    version.status !== "published"
  ) {
    return {
      status: "skipped_no_published",
      automationId: automation._id,
      detail: "Versión publicada no encontrada o no publicada.",
    };
  }

  const {
    trigger,
    conditions,
    preWaitActions,
    wait,
    waitStepIndex,
    postWaitActions,
  } = parseSteps(version);

  if (!trigger || !trigger.eventTypes.includes(event.type as GrowthDomainEventType)) {
    return {
      status: "skipped_trigger",
      automationId: automation._id,
      version: version.version,
    };
  }

  if (preWaitActions.length === 0) {
    return {
      status: "skipped_invalid_action",
      automationId: automation._id,
      version: version.version,
      detail: "Sin acciones en versión publicada.",
    };
  }

  if (!input.oportunidadId || !input.oportunidad) {
    return {
      status: "skipped_no_opportunity",
      automationId: automation._id,
      version: version.version,
      detail: "Evento sin oportunidadId resoluble en el Espacio.",
    };
  }
  if (input.oportunidad.tenantId !== event.tenantId) {
    return {
      status: "skipped_tenant",
      automationId: automation._id,
      version: version.version,
      detail: "Oportunidad de otro Espacio.",
    };
  }

  for (const cond of conditions) {
    if (!evaluateAutomationConditionRules(input.oportunidad, cond.rules)) {
      return {
        status: "skipped_condition",
        automationId: automation._id,
        version: version.version,
      };
    }
  }

  const claimSource = event.id;
  const guard = checkAutomationReentrancy({
    tenantId: event.tenantId,
    automationId: automation._id,
    version: version.version,
    sourceEventId: claimSource,
  });
  if (!guard.ok) {
    const status =
      guard.reason === "reentrant"
        ? "skipped_reentrant"
        : guard.reason === "duplicate_claim"
          ? "skipped_duplicate"
          : "skipped_max_depth";
    return {
      status,
      automationId: automation._id,
      version: version.version,
      detail: guard.detail,
    };
  }

  claimAutomationAttempt({
    tenantId: event.tenantId,
    automationId: automation._id,
    version: version.version,
    sourceEventId: claimSource,
  });

  const claimInput = {
    tenantId: event.tenantId,
    automationId: automation._id,
    version: version.version,
    sourceEventId: claimSource,
  };

  try {
    return await runWithAutomationChain(automation._id, async () => {
      const pre = await executeActionList({
        tenantId: event.tenantId,
        oportunidadId: input.oportunidadId!,
        actions: preWaitActions,
        salesOps: deps.salesOps,
        automationId: automation._id,
        version: version.version,
      });
      if (!pre.ok) {
        releaseAutomationAttempt(claimInput);
        if (pre.outcome.status === "action_failed") {
          await recordRunSafe(deps.runRecorder, {
            tenantId: event.tenantId,
            automationId: automation._id,
            attemptKey: event.id,
            eventType: event.type,
            phase: "trigger",
            status: "needs_attention",
            actionSteps: pre.steps,
            activityIds: pre.activityIds,
            errorDetail: pre.outcome.detail,
          });
        }
        return pre.outcome;
      }

      if (!wait) {
        await recordRunSafe(deps.runRecorder, {
          tenantId: event.tenantId,
          automationId: automation._id,
          attemptKey: event.id,
          eventType: event.type,
          phase: "trigger",
          status: "completed",
          actionSteps: pre.steps,
          activityIds: pre.activityIds,
        });
        return {
          status: "executed",
          automationId: automation._id,
          version: version.version,
          actions: pre.executed,
        };
      }

      if (!deps.schedule) {
        releaseAutomationAttempt(claimInput);
        return {
          status: "skipped_no_schedule",
          automationId: automation._id,
          version: version.version,
          detail: "WAIT requiere puerto schedule (core_scheduled_events).",
        };
      }

      if (postWaitActions.length === 0) {
        releaseAutomationAttempt(claimInput);
        return {
          status: "skipped_invalid_action",
          automationId: automation._id,
          version: version.version,
          detail: "WAIT sin acciones de continuación.",
        };
      }

      const scheduled = await scheduleAutomationWait({
        schedule: deps.schedule,
        tenantId: event.tenantId,
        automationId: automation._id,
        version: version.version,
        sourceEventId: event.id,
        waitStepIndex,
        wait,
        oportunidadId: input.oportunidadId!,
        correlationId: event.correlationId,
        causationId: event.id,
      });

      await recordRunSafe(deps.runRecorder, {
        tenantId: event.tenantId,
        automationId: automation._id,
        attemptKey: event.id,
        eventType: event.type,
        phase: "trigger",
        status: "waiting",
        actionSteps: pre.steps,
        activityIds: pre.activityIds,
        wait,
        scheduledFor: scheduled.scheduledFor,
      });

      return {
        status: "waiting",
        automationId: automation._id,
        version: version.version,
        scheduledId: scheduled.scheduledId,
        resumeKey: scheduled.resumeKey,
        scheduledFor: scheduled.scheduledFor,
        actions: pre.executed,
      };
    });
  } catch (err) {
    releaseAutomationAttempt(claimInput);
    const message = err instanceof Error ? err.message : String(err);
    await recordRunSafe(deps.runRecorder, {
      tenantId: event.tenantId,
      automationId: automation._id,
      attemptKey: event.id,
      eventType: event.type,
      phase: "trigger",
      status: "needs_attention",
      actionSteps: [],
      errorDetail: message,
    });
    return {
      status: "error",
      automationId: automation._id,
      version: version.version,
      detail: message,
    };
  }
}

/**
 * Reanudación tras WAIT: no reevalúa trigger/condiciones; ejecuta post-wait
 * con claim idempotente por resumeKey y tenantId del payload.
 */
export async function handleGrowthAutomationResume(
  event: GrowthAutomationEventInput,
  deps: GrowthAutomationRuntimeDeps
): Promise<GrowthAutomationHandleResult> {
  const empty: GrowthAutomationHandleResult = {
    tenantId: event.tenantId,
    eventId: event.id,
    eventType: event.type,
    outcomes: [],
  };

  if (event.type !== GROWTH_AUTOMATION_RESUME_EVENT) return empty;
  if (!isGrowthAutomationResumePayload(event.payload)) {
    return {
      ...empty,
      outcomes: [
        {
          status: "skipped_resume",
          automationId: "*",
          detail: "Payload de reanudación inválido.",
        },
      ],
    };
  }

  const payload = event.payload;
  if (payload.tenantId !== event.tenantId) {
    return {
      ...empty,
      outcomes: [
        {
          status: "skipped_tenant",
          automationId: payload.automationId,
          detail: "tenantId del evento no coincide con el payload de WAIT.",
        },
      ],
    };
  }

  try {
    const automation = await deps.automationStore.findAutomationById(
      payload.tenantId,
      payload.automationId
    );
    if (!automation || automation.tenantId !== payload.tenantId) {
      return {
        ...empty,
        outcomes: [
          {
            status: "skipped_resume",
            automationId: payload.automationId,
            detail: "Automatización no encontrada en el Espacio.",
          },
        ],
      };
    }
    if (automation.status !== "active") {
      return {
        ...empty,
        outcomes: [
          {
            status: "skipped_inactive",
            automationId: automation._id,
            version: payload.version,
            detail: `status=${automation.status}`,
          },
        ],
      };
    }

    const version = await deps.automationStore.findVersion(
      payload.tenantId,
      payload.automationId,
      payload.version
    );
    if (
      !version ||
      version.tenantId !== payload.tenantId ||
      version.status !== "published"
    ) {
      return {
        ...empty,
        outcomes: [
          {
            status: "skipped_no_published",
            automationId: payload.automationId,
            version: payload.version,
            detail: "Versión de reanudación no publicada.",
          },
        ],
      };
    }

    const { postWaitActions, wait } = parseSteps(version);
    if (!wait || postWaitActions.length === 0) {
      return {
        ...empty,
        outcomes: [
          {
            status: "skipped_invalid_action",
            automationId: automation._id,
            version: version.version,
            detail: "Versión sin WAIT/continuación.",
          },
        ],
      };
    }

    const oportunidad = await deps.opportunityStore.findById(
      payload.tenantId,
      payload.oportunidadId
    );
    if (!oportunidad || oportunidad.tenantId !== payload.tenantId) {
      return {
        ...empty,
        outcomes: [
          {
            status: "skipped_no_opportunity",
            automationId: automation._id,
            version: version.version,
            detail: "Oportunidad ausente o de otro Espacio en reanudación.",
          },
        ],
      };
    }

    const claimSource = payload.resumeKey;
    const guard = checkAutomationReentrancy({
      tenantId: payload.tenantId,
      automationId: automation._id,
      version: version.version,
      sourceEventId: claimSource,
    });
    if (!guard.ok) {
      const status =
        guard.reason === "reentrant"
          ? "skipped_reentrant"
          : guard.reason === "duplicate_claim"
            ? "skipped_duplicate"
            : "skipped_max_depth";
      return {
        ...empty,
        outcomes: [
          {
            status,
            automationId: automation._id,
            version: version.version,
            detail: guard.detail,
          },
        ],
      };
    }

    claimAutomationAttempt({
      tenantId: payload.tenantId,
      automationId: automation._id,
      version: version.version,
      sourceEventId: claimSource,
    });

    const claimInput = {
      tenantId: payload.tenantId,
      automationId: automation._id,
      version: version.version,
      sourceEventId: claimSource,
    };

    try {
      const outcome = await runWithAutomationChain(automation._id, async () => {
        const post = await executeActionList({
          tenantId: payload.tenantId,
          oportunidadId: payload.oportunidadId,
          actions: postWaitActions,
          salesOps: deps.salesOps,
          automationId: automation._id,
          version: version.version,
        });
        if (!post.ok) {
          releaseAutomationAttempt(claimInput);
          if (post.outcome.status === "action_failed") {
            await recordRunSafe(deps.runRecorder, {
              tenantId: payload.tenantId,
              automationId: automation._id,
              attemptKey: payload.sourceEventId,
              eventType: event.type,
              phase: "resume",
              status: "needs_attention",
              actionSteps: post.steps,
              activityIds: post.activityIds,
              errorDetail: post.outcome.detail,
            });
          }
          return post.outcome;
        }
        await recordRunSafe(deps.runRecorder, {
          tenantId: payload.tenantId,
          automationId: automation._id,
          attemptKey: payload.sourceEventId,
          eventType: event.type,
          phase: "resume",
          status: "completed",
          actionSteps: post.steps,
          activityIds: post.activityIds,
        });
        return {
          status: "resumed" as const,
          automationId: automation._id,
          version: version.version,
          resumeKey: payload.resumeKey,
          sourceEventId: payload.sourceEventId,
          actions: post.executed,
        };
      });

      // Propagar fallo al flush para reintento del scheduled event.
      if (outcome.status === "action_failed" || outcome.status === "error") {
        throw new Error(
          outcome.detail ?? `Automation resume failed: ${outcome.status}`
        );
      }

      return {
        tenantId: payload.tenantId,
        eventId: event.id,
        eventType: event.type,
        outcomes: [outcome],
      };
    } catch (err) {
      releaseAutomationAttempt(claimInput);
      throw err;
    }
  } catch (err) {
    // Re-lanzar para que flushScheduledEvents pueda liberar el claim del programado.
    throw err;
  }
}

/**
 * Punto de entrada del subscriber / tests (triggers Growth*).
 * Nunca lanza: aísla fallos del publish origen (ADR-006 fail isolation).
 */
export async function handleGrowthAutomationEvent(
  event: GrowthAutomationEventInput,
  deps: GrowthAutomationRuntimeDeps
): Promise<GrowthAutomationHandleResult> {
  const empty: GrowthAutomationHandleResult = {
    tenantId: event.tenantId,
    eventId: event.id,
    eventType: event.type,
    outcomes: [],
  };

  try {
    if (event.type === GROWTH_AUTOMATION_RESUME_EVENT) {
      return await handleGrowthAutomationResume(event, deps);
    }

    if (!event.tenantId || !event.id) return empty;
    if (!isGrowthDomainEventType(event.type)) return empty;

    const automations = await deps.automationStore.listAutomations(
      event.tenantId
    );
    const candidates = automations.filter(
      (a) =>
        a.tenantId === event.tenantId &&
        a.status === "active" &&
        a.publishedVersion != null
    );

    const oportunidadId = resolveOportunidadId(event);
    let oportunidad: GrowthOportunidad | null = null;
    if (oportunidadId) {
      oportunidad = await deps.opportunityStore.findById(
        event.tenantId,
        oportunidadId
      );
      if (oportunidad && oportunidad.tenantId !== event.tenantId) {
        oportunidad = null;
      }
    }

    const outcomes: AutomationAttemptOutcome[] = [];
    for (const automation of candidates) {
      const outcome = await runOneAutomation({
        automation,
        event,
        deps,
        oportunidad,
        oportunidadId,
      });
      outcomes.push(outcome);
    }

    return {
      tenantId: event.tenantId,
      eventId: event.id,
      eventType: event.type,
      outcomes,
    };
  } catch (err) {
    if (event.type === GROWTH_AUTOMATION_RESUME_EVENT) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === "development") {
      console.error("[growth.automations] handler error", message);
    }
    return {
      ...empty,
      outcomes: [
        {
          status: "error",
          automationId: "*",
          detail: message,
        },
      ],
    };
  }
}

export { GROWTH_AUTOMATION_SYSTEM_ACTOR };
