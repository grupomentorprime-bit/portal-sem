/**
 * OT-GROWTH-CORE-004 / ADR-010 §1.4 · §4.3 · §4.4 — Actividad append-only.
 * Única vía de registro: persistir en growth_actividades y luego publicar al bus.
 * Si el Event Bus falla, la Actividad NO se revierte.
 */

import { ObjectId } from "mongodb";
import {
  createMemoryGrowthEventBus,
  growthEventTypeForActivityKind,
  type GrowthEventBusPort,
} from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import type { GrowthActivity, GrowthActivityKind } from "./types";

function newId(): string {
  return new ObjectId().toString();
}

/**
 * Persistencia mínima de Actividad (append-only + setEventId técnico).
 * Persona store y Opportunity store implementan este contrato — una sola semántica.
 */
export interface GrowthActivityRecorder {
  /**
   * Insert idempotente por ingestKey (tenantId + ingestKey).
   * Si ya existe → retorna la existente (sin duplicar).
   */
  recordActivity(activity: GrowthActivity): Promise<GrowthActivity>;
  /**
   * Solo rellena eventId tras publicar. No es update de negocio (append-only).
   */
  setActivityEventId(
    tenantId: string,
    activityId: string,
    eventId: string
  ): Promise<GrowthActivity | null>;
  /** Lookup para short-circuit de ingestión idempotente. */
  findActivityByIngestKey(
    tenantId: string,
    ingestKey: string
  ): Promise<GrowthActivity | null>;
}

export interface RecordGrowthActivityInput {
  tenantId: string;
  personaId: string;
  kind: GrowthActivityKind;
  summary: string;
  oportunidadId?: string;
  ingestKey?: string;
  sourceCollection?: string;
  sourceId?: string;
  payload?: Record<string, unknown>;
  actorUserId?: string;
  occurredAt?: string;
  /** Si true y hay sourceCollection/sourceId, arma ingestKey canónico. */
  buildIngestFromSource?: boolean;
}

export interface RecordGrowthActivityOptions {
  eventBus?: GrowthEventBusPort;
}

function requireTenantAndPersona(
  tenantId: string | undefined,
  personaId: string | undefined
): { tenantId: string; personaId: string } | null {
  const t = tenantId?.trim();
  const p = personaId?.trim();
  if (!t || !p) return null;
  return { tenantId: t, personaId: p };
}

/**
 * Append-only: inserta Actividad y publica al Event Bus existente.
 * Idempotente por ingestKey. Fallo del bus → Actividad queda sin eventId.
 */
export async function recordGrowthActivity(
  store: GrowthActivityRecorder,
  input: RecordGrowthActivityInput,
  options?: RecordGrowthActivityOptions
): Promise<
  | {
      ok: true;
      activity: GrowthActivity;
      published: boolean;
      duplicated: boolean;
    }
  | { ok: false; reason: "missing_tenant_or_persona" }
> {
  const ids = requireTenantAndPersona(input.tenantId, input.personaId);
  if (!ids) return { ok: false, reason: "missing_tenant_or_persona" };

  const now = input.occurredAt ?? new Date().toISOString();
  let ingestKey = input.ingestKey;
  if (
    !ingestKey &&
    input.buildIngestFromSource &&
    input.sourceCollection &&
    input.sourceId
  ) {
    ingestKey = buildGrowthIngestKey(
      input.sourceCollection,
      input.sourceId,
      input.kind
    );
  }

  const draft: GrowthActivity = {
    _id: newId(),
    tenantId: ids.tenantId,
    personaId: ids.personaId,
    kind: input.kind,
    summary: input.summary,
    occurredAt: now,
    ...(input.oportunidadId ? { oportunidadId: input.oportunidadId } : {}),
    ...(ingestKey ? { ingestKey } : {}),
    ...(input.sourceCollection
      ? { sourceCollection: input.sourceCollection }
      : {}),
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.payload ? { payload: { ...input.payload } } : {}),
    ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
  };

  const saved = await store.recordActivity(draft);
  const duplicated = saved._id !== draft._id;

  // Ya publicada (reintento idempotente) → no republicar
  if (saved.eventId) {
    return { ok: true, activity: saved, published: false, duplicated: true };
  }

  const eventBus = options?.eventBus;
  if (!eventBus) {
    return { ok: true, activity: saved, published: false, duplicated };
  }

  try {
    const type = growthEventTypeForActivityKind(saved.kind);
    const publishedEvt = await eventBus.publish({
      type,
      tenantId: saved.tenantId,
      entityType: "growth.activity",
      entityId: saved._id,
      userId: saved.actorUserId,
      payload: {
        kind: saved.kind,
        personaId: saved.personaId,
        ...(saved.oportunidadId
          ? { oportunidadId: saved.oportunidadId }
          : {}),
        ...(saved.ingestKey ? { ingestKey: saved.ingestKey } : {}),
        ...(saved.payload ? { activityPayload: saved.payload } : {}),
      },
    });

    const withEvent =
      (await store.setActivityEventId(
        saved.tenantId,
        saved._id,
        publishedEvt.id
      )) ?? { ...saved, eventId: publishedEvt.id };

    return {
      ok: true,
      activity: withEvent,
      published: true,
      duplicated,
    };
  } catch {
    // Actividad ya persistida — no revertir
    return { ok: true, activity: saved, published: false, duplicated };
  }
}

export { createMemoryGrowthEventBus };
