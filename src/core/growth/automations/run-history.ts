/**
 * OT-GROWTH-AUTOMATION-007 — registrar / listar ejecuciones (proyección fina).
 * Reutiliza outcomes del runtime; no republica ni copia el Event Bus.
 */

import { ObjectId } from "mongodb";
import {
  AUTOMATION_HISTORY_COMPLETED_LINE,
  AUTOMATION_HISTORY_FAILED_LINE,
  automationActionPastLine,
  automationTriggerPastLabel,
  automationWaitDurationLabel,
  automationWaitingLines,
  sanitizeAutomationErrorDetail,
} from "./history-prose";
import type { GrowthAutomationRunStore } from "./run-store";
import type {
  GrowthAutomationActionStep,
  GrowthAutomationRun,
  GrowthAutomationRunLine,
  GrowthAutomationRunStatus,
  GrowthAutomationWaitStep,
} from "./types";

function newId(): string {
  return new ObjectId().toString();
}

function line(at: string, text: string): GrowthAutomationRunLine {
  return { at, text };
}

function appendUnique(
  existing: GrowthAutomationRunLine[],
  next: GrowthAutomationRunLine[]
): GrowthAutomationRunLine[] {
  const out = [...existing];
  for (const item of next) {
    if (out.some((l) => l.text === item.text && l.at === item.at)) continue;
    // Evitar duplicar la misma frase aunque el timestamp cambie en reintento.
    if (out.some((l) => l.text === item.text)) continue;
    out.push(item);
  }
  return out;
}

export type RecordAutomationRunPhaseInput = {
  tenantId: string;
  automationId: string;
  /** sourceEventId del disparo original (también en resume). */
  attemptKey: string;
  eventType: string;
  phase: "trigger" | "resume";
  status: GrowthAutomationRunStatus;
  actionSteps: GrowthAutomationActionStep[];
  activityIds?: string[];
  wait?: GrowthAutomationWaitStep | null;
  scheduledFor?: string;
  errorDetail?: string;
  now?: string;
};

/**
 * Upsert idempotente por (tenantId, automationId, attemptKey).
 * Reintentos y reanudación actualizan la misma ejecución.
 */
export async function recordAutomationRunPhase(
  store: GrowthAutomationRunStore,
  input: RecordAutomationRunPhaseInput
): Promise<GrowthAutomationRun> {
  const now = input.now ?? new Date().toISOString();
  const existing = await store.findByAttemptKey(
    input.tenantId,
    input.automationId,
    input.attemptKey
  );

  const startedAt = existing?.startedAt ?? now;
  const newLines: GrowthAutomationRunLine[] = [];

  if (input.phase === "trigger" && !existing) {
    const trigger = automationTriggerPastLabel(input.eventType);
    if (trigger) newLines.push(line(now, trigger));
  }

  for (const step of input.actionSteps) {
    newLines.push(line(now, automationActionPastLine(step)));
  }

  let waitDurationLabel = existing?.waitDurationLabel;
  let scheduledFor = existing?.scheduledFor;

  if (input.status === "waiting" && input.wait && input.scheduledFor) {
    waitDurationLabel = automationWaitDurationLabel(input.wait);
    scheduledFor = input.scheduledFor;
    newLines.push(
      ...automationWaitingLines({
        waitDurationLabel,
        scheduledFor: input.scheduledFor,
        at: now,
      })
    );
  }

  if (input.status === "completed") {
    newLines.push(line(now, AUTOMATION_HISTORY_COMPLETED_LINE));
  }

  if (input.status === "needs_attention") {
    newLines.push(line(now, AUTOMATION_HISTORY_FAILED_LINE));
  }

  const activityIds = [
    ...(existing?.activityIds ?? []),
    ...(input.activityIds ?? []),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  const errorDetail =
    input.status === "needs_attention"
      ? sanitizeAutomationErrorDetail(input.errorDetail)
      : undefined;

  let mergedLines = appendUnique(existing?.lines ?? [], newLines);
  // Reintento OK tras fallo: quita el aviso de problema y la espera activa.
  if (input.status === "completed") {
    mergedLines = mergedLines.filter(
      (l) =>
        l.text !== AUTOMATION_HISTORY_FAILED_LINE &&
        !l.text.startsWith("Está esperando ") &&
        !l.text.startsWith("Continuará el ")
    );
  }

  const doc: GrowthAutomationRun = {
    _id: existing?._id ?? newId(),
    tenantId: input.tenantId,
    automationId: input.automationId,
    attemptKey: input.attemptKey,
    status: input.status,
    startedAt,
    updatedAt: now,
    lines: mergedLines,
    ...(scheduledFor && input.status === "waiting" ? { scheduledFor } : {}),
    ...(waitDurationLabel ? { waitDurationLabel } : {}),
    ...(activityIds.length ? { activityIds } : {}),
    ...(errorDetail ? { errorDetail } : {}),
  };

  return store.upsertRun(doc);
}

export async function listAutomationRuns(
  store: GrowthAutomationRunStore,
  input: { tenantId: string; automationId: string; limit?: number }
): Promise<GrowthAutomationRun[]> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  return store.listRecent(input.tenantId, input.automationId, limit);
}

export type GrowthAutomationRunRecorder = {
  recordPhase: (input: RecordAutomationRunPhaseInput) => Promise<void>;
};

export function createAutomationRunRecorder(
  store: GrowthAutomationRunStore
): GrowthAutomationRunRecorder {
  return {
    async recordPhase(input) {
      await recordAutomationRunPhase(store, input);
    },
  };
}
