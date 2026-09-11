/**
 * OT-GROWTH-AUTOMATION-003/005/007 — adapter sales-ops real + schedule + historial + handler Event Bus.
 * Reutiliza sales-ops y schedule()/core_scheduled_events; no duplica motores.
 */

import "server-only";

import {
  createAutomationRunRecorder,
  createMongoGrowthAutomationRunStore,
  createMongoGrowthAutomationStore,
  handleGrowthAutomationEvent,
  type GrowthAutomationEventInput,
  type GrowthAutomationHandleResult,
  type GrowthAutomationSalesOpsPort,
  type GrowthAutomationSchedulePort,
} from "@/core/growth/automations";
import { createMongoGrowthOpportunityStore } from "@/core/growth";
import { schedule } from "@/core/events/publisher";
import { getDatabase } from "@/lib/mongodb";
import {
  salesClearNextAction,
  salesRecordFollowUp,
  salesSetNextAction,
  salesTransitionOpportunity,
} from "@/lib/growth/sales-ops";
import { GROWTH_AUTOMATION_RESUME_EVENT } from "@/core/growth/automations/wait";

export function createSalesOpsAutomationPort(): GrowthAutomationSalesOpsPort {
  return {
    salesTransitionOpportunity: (input) => salesTransitionOpportunity(input),
    salesRecordFollowUp: (input) => salesRecordFollowUp(input),
    salesSetNextAction: (input) => salesSetNextAction(input),
    salesClearNextAction: (input) => salesClearNextAction(input),
  };
}

export function createAutomationSchedulePort(): GrowthAutomationSchedulePort {
  return {
    schedule: (input) => schedule(input),
  };
}

async function runtimeDeps() {
  const db = await getDatabase();
  return {
    automationStore: createMongoGrowthAutomationStore(db),
    opportunityStore: createMongoGrowthOpportunityStore(db),
    salesOps: createSalesOpsAutomationPort(),
    schedule: createAutomationSchedulePort(),
    runRecorder: createAutomationRunRecorder(
      createMongoGrowthAutomationRunStore(db)
    ),
  };
}

/**
 * Handler in-process del Event Bus (Growth* + GrowthAutomationResume).
 * Triggers Growth*: fail-soft (no propaga).
 * Reanudación: propaga error para que flushScheduledEvents reintente.
 */
export async function onGrowthAutomationDomainEvent(
  event: GrowthAutomationEventInput
): Promise<GrowthAutomationHandleResult> {
  const isResume = event.type === GROWTH_AUTOMATION_RESUME_EVENT;
  try {
    return await handleGrowthAutomationEvent(event, await runtimeDeps());
  } catch (err) {
    if (isResume) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === "development") {
      console.error("[growth.automations] wire error", message);
    }
    return {
      tenantId: event.tenantId,
      eventId: event.id,
      eventType: event.type,
      outcomes: [
        { status: "error", automationId: "*", detail: message },
      ],
    };
  }
}
