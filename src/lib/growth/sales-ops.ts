/**
 * OT-GROWTH-SALES-001 — operaciones de Ventas sobre Growth Core.
 * Capa reutilizable (UI + APIs + futuro Automatizaciones).
 * No duplica dominio: delega en transition / nextAction / recordGrowthActivity.
 */

import "server-only";

import {
  clearGrowthNextAction,
  createMongoGrowthOpportunityStore,
  listAvailableGrowthOpportunityTransitions,
  recordGrowthActivity,
  setGrowthNextAction,
  transitionGrowthOpportunity,
  type GrowthActivity,
  type GrowthNextActionKind,
  type GrowthOportunidad,
  type GrowthOpportunityHandoff,
} from "@/core/growth";
import { getDatabase } from "@/lib/mongodb";
import { createGrowthEventBusAdapter } from "./event-bus";
import { createMongoGrowthOpportunityWorkflow } from "./opportunity-workflow";

export type SalesOpsActor = {
  /** Usuario operador de sesión (acciones manuales). */
  userId: string;
};

async function salesOpsDeps() {
  const db = await getDatabase();
  return {
    store: createMongoGrowthOpportunityStore(db),
    workflow: createMongoGrowthOpportunityWorkflow(),
    eventBus: createGrowthEventBusAdapter(),
  };
}

export async function salesTransitionOpportunity(input: {
  tenantId: string;
  oportunidadId: string;
  actor: SalesOpsActor;
  toState?: string;
  transitionId?: string;
  comment?: string;
  handoff?: GrowthOpportunityHandoff;
}): Promise<
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      fromState: string;
      toState: string;
      activity: GrowthActivity;
    }
  | { ok: false; reason: "not_found" | "invalid_transition"; error?: string }
> {
  const { store, workflow, eventBus } = await salesOpsDeps();
  const result = await transitionGrowthOpportunity(store, workflow, {
    tenantId: input.tenantId,
    oportunidadId: input.oportunidadId,
    toState: input.toState,
    transitionId: input.transitionId,
    comment: input.comment,
    handoff: input.handoff,
    actorUserId: input.actor.userId,
    eventBus,
  });
  if (!result.ok) {
    return result.reason === "not_found"
      ? { ok: false, reason: "not_found" }
      : {
          ok: false,
          reason: "invalid_transition",
          error: result.error,
        };
  }
  return {
    ok: true,
    oportunidad: result.oportunidad,
    fromState: result.fromState,
    toState: result.toState,
    activity: result.activity,
  };
}

export async function salesRecordFollowUp(input: {
  tenantId: string;
  oportunidadId: string;
  actor: SalesOpsActor;
  kind: "note" | "contact";
  summary: string;
}): Promise<
  | {
      ok: true;
      activity: GrowthActivity;
      published: boolean;
      oportunidad: GrowthOportunidad;
    }
  | { ok: false; reason: "not_found" | "missing_summary" }
> {
  const summary = input.summary?.trim();
  if (!summary) return { ok: false, reason: "missing_summary" };

  const { store, eventBus } = await salesOpsDeps();
  const oportunidad = await store.findById(
    input.tenantId,
    input.oportunidadId
  );
  if (!oportunidad) return { ok: false, reason: "not_found" };

  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId: oportunidad.tenantId,
      personaId: oportunidad.personaId,
      oportunidadId: oportunidad._id,
      kind: input.kind,
      summary,
      actorUserId: input.actor.userId,
      payload: { source: "sales_ops" },
    },
    { eventBus }
  );
  if (!recorded.ok) return { ok: false, reason: "not_found" };

  return {
    ok: true,
    activity: recorded.activity,
    published: recorded.published,
    oportunidad,
  };
}

export async function salesSetNextAction(input: {
  tenantId: string;
  oportunidadId: string;
  actor: SalesOpsActor;
  summary: string;
  dueAt?: string;
  kind?: GrowthNextActionKind;
  assigneeUserId?: string;
}): Promise<
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      activity: GrowthActivity;
    }
  | { ok: false; reason: "not_found" | "missing_summary" }
> {
  const { store, eventBus } = await salesOpsDeps();
  const result = await setGrowthNextAction(store, {
    tenantId: input.tenantId,
    oportunidadId: input.oportunidadId,
    summary: input.summary,
    dueAt: input.dueAt,
    kind: input.kind,
    assigneeUserId: input.assigneeUserId,
    actorUserId: input.actor.userId,
    eventBus,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    oportunidad: result.oportunidad,
    activity: result.activity,
  };
}

export async function salesClearNextAction(input: {
  tenantId: string;
  oportunidadId: string;
  actor: SalesOpsActor;
}): Promise<
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      activity: GrowthActivity;
    }
  | { ok: false; reason: "not_found" }
> {
  const { store, eventBus } = await salesOpsDeps();
  const result = await clearGrowthNextAction(store, {
    tenantId: input.tenantId,
    oportunidadId: input.oportunidadId,
    actorUserId: input.actor.userId,
    eventBus,
  });
  if (!result.ok) return { ok: false, reason: "not_found" };
  return {
    ok: true,
    oportunidad: result.oportunidad,
    activity: result.activity,
  };
}

export function salesAvailableTransitions(status: string) {
  return listAvailableGrowthOpportunityTransitions(status);
}
