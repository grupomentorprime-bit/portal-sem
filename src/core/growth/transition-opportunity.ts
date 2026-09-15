/**
 * OT-GROWTH-CORE-003/004 / ADR-010 §3 — transicionar Oportunidad vía Workflow.
 * status espeja currentState. handed_off no borra Persona ni Oportunidad.
 * Toda transición → Actividad opportunity_transitioned; handoff → también kind handoff.
 */

import { recordGrowthActivity } from "./activity";
import type { GrowthEventBusPort } from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import { clearGrowthNextAction } from "./next-action";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthOpportunityWorkflowPort } from "./opportunity-workflow-port";
import type {
  GrowthActivity,
  GrowthOpportunityHandoff,
  GrowthOpportunityStatus,
  GrowthOportunidad,
} from "./types";

export interface TransitionGrowthOpportunityInput {
  tenantId: string;
  oportunidadId: string;
  toState?: string;
  transitionId?: string;
  comment?: string;
  /** Si toState/transition → handed_off, se fusiona en la Oportunidad. */
  handoff?: GrowthOpportunityHandoff;
  now?: string;
  actorUserId?: string;
  /** Para ingestKey opcional de la actividad. */
  sourceCollection?: string;
  sourceId?: string;
  eventBus?: GrowthEventBusPort;
}

export type TransitionGrowthOpportunityResult =
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      fromState: string;
      toState: string;
      activity: GrowthActivity;
      handoffActivity?: GrowthActivity;
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_transition"; error: string };

export async function transitionGrowthOpportunity(
  store: GrowthOpportunityStore,
  workflow: GrowthOpportunityWorkflowPort,
  input: TransitionGrowthOpportunityInput
): Promise<TransitionGrowthOpportunityResult> {
  const now = input.now ?? new Date().toISOString();
  const existing = await store.findById(input.tenantId, input.oportunidadId);
  if (!existing) return { ok: false, reason: "not_found" };

  let wfResult;
  try {
    wfResult = await workflow.transition({
      tenantId: input.tenantId,
      instanceId: existing.workflowInstanceId,
      toState: input.toState,
      transitionId: input.transitionId,
      comment: input.comment,
      metadata: input.handoff
        ? { handoff: { ...input.handoff } }
        : undefined,
      performedBy: input.actorUserId,
    });
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_transition",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const toState = wfResult.toState as GrowthOpportunityStatus;
  const closedAt = isGrowthOpportunityFinalStatus(toState) ? now : undefined;

  const updated: GrowthOportunidad = {
    ...existing,
    status: toState,
    updatedAt: now,
    ...(closedAt ? { closedAt } : {}),
    ...(toState === "handed_off" && input.handoff
      ? { handoff: { ...input.handoff } }
      : existing.handoff
        ? { handoff: existing.handoff }
        : {}),
  };

  // Preservar handoff previo si se cierra por otra vía
  if (toState === "handed_off" && !input.handoff && existing.handoff) {
    updated.handoff = existing.handoff;
  }

  const savedInitial = await store.replace(updated);
  let saved = savedInitial;

  const sourceCollection = input.sourceCollection ?? "growth_oportunidades";
  const sourceId =
    input.sourceId ?? `${saved._id}:${wfResult.fromState}:${toState}:${now}`;

  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId: saved.tenantId,
      personaId: saved.personaId,
      oportunidadId: saved._id,
      kind: "opportunity_transitioned",
      summary: `Oportunidad ${wfResult.fromState} → ${toState}`,
      ingestKey: buildGrowthIngestKey(
        sourceCollection,
        sourceId,
        "opportunity_transitioned"
      ),
      sourceCollection,
      sourceId,
      payload: {
        fromState: wfResult.fromState,
        toState,
        workflowInstanceId: saved.workflowInstanceId,
        ...(saved.handoff ? { handoff: saved.handoff } : {}),
      },
      actorUserId: input.actorUserId,
      occurredAt: now,
    },
    { eventBus: input.eventBus }
  );

  if (!recorded.ok) {
    return {
      ok: false,
      reason: "invalid_transition",
      error: "failed to record transition activity",
    };
  }

  let handoffActivity: GrowthActivity | undefined;
  if (toState === "handed_off") {
    const handoffRecorded = await recordGrowthActivity(
      store,
      {
        tenantId: saved.tenantId,
        personaId: saved.personaId,
        oportunidadId: saved._id,
        kind: "handoff",
        summary: "Handoff registrado",
        ingestKey: buildGrowthIngestKey(sourceCollection, sourceId, "handoff"),
        sourceCollection,
        sourceId,
        payload: {
          ...(saved.handoff ? { handoff: saved.handoff } : {}),
          fromState: wfResult.fromState,
          toState,
        },
        actorUserId: input.actorUserId,
        occurredAt: now,
      },
      { eventBus: input.eventBus }
    );
    if (handoffRecorded.ok) handoffActivity = handoffRecorded.activity;
  }

  // E2E-FIX-001 — higiene: estados finales no conservan nextAction obsoleto.
  if (
    isGrowthOpportunityFinalStatus(toState) &&
    existing.nextAction != null
  ) {
    const cleared = await clearGrowthNextAction(store, {
      tenantId: saved.tenantId,
      oportunidadId: saved._id,
      now,
      actorUserId: input.actorUserId,
      eventBus: input.eventBus,
    });
    if (cleared.ok) {
      saved = cleared.oportunidad;
    }
  }

  return {
    ok: true,
    oportunidad: saved,
    fromState: wfResult.fromState,
    toState,
    activity: recorded.activity,
    ...(handoffActivity ? { handoffActivity } : {}),
  };
}

/** Atajo semántico: salida académica hacia sistema externo sin borrar. */
export async function handOffGrowthOpportunity(
  store: GrowthOpportunityStore,
  workflow: GrowthOpportunityWorkflowPort,
  input: Omit<TransitionGrowthOpportunityInput, "toState" | "transitionId"> & {
    handoff: GrowthOpportunityHandoff;
  }
): Promise<TransitionGrowthOpportunityResult> {
  return transitionGrowthOpportunity(store, workflow, {
    ...input,
    transitionId: "hand_off",
    toState: "handed_off",
  });
}
