/**
 * OT-GROWTH-CORE-003/004 / ADR-010 §1.5 — nextAction embebido (sin motor de tareas).
 * Crear / actualizar / cerrar (null). Cada cambio → Actividad next_action_set.
 */

import { recordGrowthActivity } from "./activity";
import type { GrowthEventBusPort } from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type {
  GrowthActivity,
  GrowthNextAction,
  GrowthNextActionKind,
  GrowthOportunidad,
} from "./types";

export interface SetGrowthNextActionInput {
  tenantId: string;
  oportunidadId: string;
  /** Qué hacer (ADR summary; OT brief: what). */
  summary: string;
  dueAt?: string;
  /** Responsable (ADR assigneeUserId; OT brief: assigneeId). */
  assigneeUserId?: string;
  kind?: GrowthNextActionKind;
  now?: string;
  actorUserId?: string;
  eventBus?: GrowthEventBusPort;
}

export interface ClearGrowthNextActionInput {
  tenantId: string;
  oportunidadId: string;
  now?: string;
  actorUserId?: string;
  eventBus?: GrowthEventBusPort;
}

export type SetGrowthNextActionResult =
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      nextAction: GrowthNextAction | null;
      activity: GrowthActivity;
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "missing_summary" };

async function recordNextActionActivity(
  store: GrowthOpportunityStore,
  oportunidad: GrowthOportunidad,
  nextAction: GrowthNextAction | null,
  now: string,
  actorUserId?: string,
  eventBus?: GrowthEventBusPort
): Promise<GrowthActivity> {
  const sourceId = `${oportunidad._id}:next_action:${now}`;
  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId: oportunidad.tenantId,
      personaId: oportunidad.personaId,
      oportunidadId: oportunidad._id,
      kind: "next_action_set",
      summary: nextAction
        ? `Próxima acción: ${nextAction.summary}`
        : "Próxima acción cerrada",
      ingestKey: buildGrowthIngestKey(
        "growth_oportunidades",
        sourceId,
        "next_action_set"
      ),
      sourceCollection: "growth_oportunidades",
      sourceId,
      payload: { nextAction },
      actorUserId,
      occurredAt: now,
    },
    { eventBus }
  );
  if (!recorded.ok) {
    throw new Error("next_action activity requires tenantId and personaId");
  }
  return recorded.activity;
}

/** Crear o actualizar la próxima acción vigente. */
export async function setGrowthNextAction(
  store: GrowthOpportunityStore,
  input: SetGrowthNextActionInput
): Promise<SetGrowthNextActionResult> {
  const summary = input.summary?.trim();
  if (!summary) return { ok: false, reason: "missing_summary" };

  const existing = await store.findById(input.tenantId, input.oportunidadId);
  if (!existing) return { ok: false, reason: "not_found" };

  const now = input.now ?? new Date().toISOString();
  const nextAction: GrowthNextAction = {
    summary,
    kind: input.kind ?? "other",
    setAt: now,
    ...(input.dueAt ? { dueAt: input.dueAt } : {}),
    ...(input.assigneeUserId?.trim()
      ? { assigneeUserId: input.assigneeUserId.trim() }
      : {}),
  };

  const updated: GrowthOportunidad = {
    ...existing,
    nextAction,
    updatedAt: now,
  };
  const saved = await store.replace(updated);
  const activity = await recordNextActionActivity(
    store,
    saved,
    nextAction,
    now,
    input.actorUserId,
    input.eventBus
  );

  return { ok: true, oportunidad: saved, nextAction, activity };
}

/** Cerrar la próxima acción (limpia el campo; historial vía Actividad). */
export async function clearGrowthNextAction(
  store: GrowthOpportunityStore,
  input: ClearGrowthNextActionInput
): Promise<SetGrowthNextActionResult> {
  const existing = await store.findById(input.tenantId, input.oportunidadId);
  if (!existing) return { ok: false, reason: "not_found" };

  const now = input.now ?? new Date().toISOString();
  const updated: GrowthOportunidad = {
    ...existing,
    nextAction: null,
    updatedAt: now,
  };
  const saved = await store.replace(updated);
  const activity = await recordNextActionActivity(
    store,
    saved,
    null,
    now,
    input.actorUserId,
    input.eventBus
  );

  return { ok: true, oportunidad: saved, nextAction: null, activity };
}
