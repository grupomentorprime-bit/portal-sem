/**
 * OT-GROWTH-AUTOMATION-005 — WAIT → schedule(GrowthAutomationResume).
 * Reutiliza schedule()/core_scheduled_events; no inventa cola paralela.
 */

import type { GrowthAutomationWaitStep } from "./types";

/** Evento interno de reanudación (no es trigger Growth* de catálogo). */
export const GROWTH_AUTOMATION_RESUME_EVENT = "GrowthAutomationResume" as const;

export type GrowthAutomationResumePayload = {
  kind: "automation_resume";
  tenantId: string;
  automationId: string;
  version: number;
  /** Evento Growth* que originó la Automatización. */
  sourceEventId: string;
  /** Clave estable de idempotencia de esta espera. */
  resumeKey: string;
  waitStepIndex: number;
  oportunidadId: string;
  correlationId?: string;
  durationMs: number;
};

export type GrowthAutomationSchedulePort = {
  schedule(input: {
    tenantId: string;
    type: string;
    entityType: string;
    entityId: string;
    payload?: Record<string, unknown>;
    scheduledFor: string;
  }): Promise<{ scheduledId: string }>;
};

export function automationResumeKey(input: {
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
  waitStepIndex: number;
}): string {
  return `${input.tenantId}:${input.automationId}:v${input.version}:${input.sourceEventId}:wait:${input.waitStepIndex}`;
}

export function isGrowthAutomationResumePayload(
  value: unknown
): value is GrowthAutomationResumePayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    p.kind === "automation_resume" &&
    typeof p.tenantId === "string" &&
    typeof p.automationId === "string" &&
    typeof p.version === "number" &&
    typeof p.sourceEventId === "string" &&
    typeof p.resumeKey === "string" &&
    typeof p.waitStepIndex === "number" &&
    typeof p.oportunidadId === "string"
  );
}

export async function scheduleAutomationWait(input: {
  schedule: GrowthAutomationSchedulePort;
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
  waitStepIndex: number;
  wait: GrowthAutomationWaitStep;
  oportunidadId: string;
  correlationId?: string;
  causationId?: string;
  nowMs?: number;
}): Promise<{ scheduledId: string; resumeKey: string; scheduledFor: string }> {
  const now = input.nowMs ?? Date.now();
  const scheduledFor = new Date(now + input.wait.durationMs).toISOString();
  const resumeKey = automationResumeKey({
    tenantId: input.tenantId,
    automationId: input.automationId,
    version: input.version,
    sourceEventId: input.sourceEventId,
    waitStepIndex: input.waitStepIndex,
  });

  const payload: GrowthAutomationResumePayload = {
    kind: "automation_resume",
    tenantId: input.tenantId,
    automationId: input.automationId,
    version: input.version,
    sourceEventId: input.sourceEventId,
    resumeKey,
    waitStepIndex: input.waitStepIndex,
    oportunidadId: input.oportunidadId,
    correlationId: input.correlationId,
    durationMs: input.wait.durationMs,
  };

  const { scheduledId } = await input.schedule.schedule({
    tenantId: input.tenantId,
    type: GROWTH_AUTOMATION_RESUME_EVENT,
    entityType: "growth_automation",
    entityId: input.automationId,
    payload: {
      ...payload,
      causationId: input.causationId ?? input.sourceEventId,
    },
    scheduledFor,
  });

  return { scheduledId, resumeKey, scheduledFor };
}

/** Puerto en memoria para tests del runtime WAIT. */
export function createMemoryAutomationSchedulePort(): GrowthAutomationSchedulePort & {
  items: Array<{
    scheduledId: string;
    tenantId: string;
    type: string;
    entityType: string;
    entityId: string;
    payload: Record<string, unknown>;
    scheduledFor: string;
    status: "scheduled" | "published" | "cancelled";
  }>;
  flushDue(
    nowIso: string,
    publish: (item: {
      tenantId: string;
      type: string;
      entityType: string;
      entityId: string;
      payload: Record<string, unknown>;
      scheduledId: string;
    }) => Promise<void>
  ): Promise<number>;
} {
  const items: Array<{
    scheduledId: string;
    tenantId: string;
    type: string;
    entityType: string;
    entityId: string;
    payload: Record<string, unknown>;
    scheduledFor: string;
    status: "scheduled" | "published" | "cancelled";
  }> = [];
  let seq = 0;

  return {
    items,
    async schedule(input) {
      seq += 1;
      const scheduledId = `sched-mem-${seq}`;
      items.push({
        scheduledId,
        tenantId: input.tenantId,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload ?? {},
        scheduledFor: input.scheduledFor,
        status: "scheduled",
      });
      return { scheduledId };
    },
    async flushDue(nowIso, publish) {
      let count = 0;
      for (const item of items) {
        if (item.status !== "scheduled") continue;
        if (item.scheduledFor > nowIso) continue;
        item.status = "published";
        await publish({
          tenantId: item.tenantId,
          type: item.type,
          entityType: item.entityType,
          entityId: item.entityId,
          payload: item.payload,
          scheduledId: item.scheduledId,
        });
        count += 1;
      }
      return count;
    },
  };
}
