/**
 * Responsable de la oportunidad. No cambia etapa, próxima acción ni embudo.
 */

import { recordGrowthActivity } from "./activity";
import { buildGrowthIngestKey } from "./ingest-key";
import type { GrowthEventBusPort } from "./event-bus-port";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthActivity, GrowthOportunidad } from "./types";

export interface AssignGrowthOpportunityOwnerInput {
  tenantId: string;
  oportunidadId: string;
  actorUserId: string;
  /** `null` quita al responsable. */
  ownerUserId: string | null;
  now?: string;
  eventBus?: GrowthEventBusPort;
  isMember: (tenantId: string, userId: string) => Promise<boolean>;
}

export type AssignGrowthOpportunityOwnerResult =
  | {
      ok: true;
      oportunidad: GrowthOportunidad;
      activity: GrowthActivity | null;
      unchanged: boolean;
    }
  | { ok: false; reason: "not_found" | "not_member" };

export async function assignGrowthOpportunityOwner(
  store: GrowthOpportunityStore,
  input: AssignGrowthOpportunityOwnerInput
): Promise<AssignGrowthOpportunityOwnerResult> {
  const existing = await store.findById(input.tenantId, input.oportunidadId);
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, reason: "not_found" };
  }

  const nextOwner = input.ownerUserId?.trim() || null;
  if (nextOwner) {
    const member = await input.isMember(input.tenantId, nextOwner);
    if (!member) return { ok: false, reason: "not_member" };
  }

  const previous = existing.ownerUserId?.trim() || null;
  if (previous === nextOwner) {
    return { ok: true, oportunidad: existing, activity: null, unchanged: true };
  }

  const now = input.now ?? new Date().toISOString();
  const next: GrowthOportunidad = {
    ...existing,
    updatedAt: now,
  };
  if (nextOwner) next.ownerUserId = nextOwner;
  else delete next.ownerUserId;

  const saved = await store.replace(next);
  const summary = nextOwner
    ? previous
      ? "Responsable reasignado"
      : "Responsable asignado"
    : "Responsable quitado";
  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId: saved.tenantId,
      personaId: saved.personaId,
      oportunidadId: saved._id,
      kind: "opportunity_assigned",
      summary,
      ingestKey: buildGrowthIngestKey(
        "growth_oportunidades",
        `${saved._id}:owner:${now}`,
        "opportunity_assigned"
      ),
      payload: {
        fromUserId: previous,
        toUserId: nextOwner,
      },
      actorUserId: input.actorUserId,
      occurredAt: now,
    },
    { eventBus: input.eventBus }
  );
  if (!recorded.ok) return { ok: false, reason: "not_found" };

  const fresh = (await store.findById(saved.tenantId, saved._id)) ?? saved;
  return {
    ok: true,
    oportunidad: fresh,
    activity: recorded.activity,
    unchanged: false,
  };
}
