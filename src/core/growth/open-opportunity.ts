/**
 * OT-GROWTH-CORE-003/004 / ADR-010 §1.3 · §4.3 — abrir o reutilizar Oportunidad.
 * Una Persona → N Oportunidades. Reuso si misma typeKey+asunto y status no final.
 * Al crear: Actividad opportunity_opened vía recordGrowthActivity (+ Event Bus).
 */

import { ObjectId } from "mongodb";
import { recordGrowthActivity } from "./activity";
import type { GrowthEventBusPort } from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthOpportunityWorkflowPort } from "./opportunity-workflow-port";
import { buildGrowthOrigin } from "./origin";
import {
  isAllowedOpportunityTypeKey,
  resolveGrowthSpaceConfig,
} from "./space-config";
import type {
  GrowthActivity,
  GrowthOriginInput,
  GrowthOportunidad,
  GrowthOpportunitySubjectType,
  GrowthOpportunityStatus,
} from "./types";

function newId(): string {
  return new ObjectId().toString();
}

export interface OpenGrowthOpportunityInput {
  tenantId: string;
  personaId: string;
  typeKey: string;
  origin: GrowthOriginInput;
  sourceCollection: string;
  sourceId: string;
  subjectType?: GrowthOpportunitySubjectType;
  subjectId?: string;
  subjectLabel?: string;
  now?: string;
  actorUserId?: string;
  eventBus?: GrowthEventBusPort;
}

export type OpenGrowthOpportunityResult =
  | {
      ok: true;
      outcome: "created" | "reused";
      oportunidad: GrowthOportunidad;
      activity?: GrowthActivity;
    }
  | { ok: false; reason: "invalid_type_key" }
  | { ok: false; reason: "missing_tenant_or_persona" };

function sameSubject(
  a: { subjectType: string; subjectId?: string },
  subjectType: string,
  subjectId?: string
): boolean {
  const aId = a.subjectId ?? "";
  const bId = subjectId ?? "";
  return a.subjectType === subjectType && aId === bId;
}

export async function openGrowthOpportunity(
  store: GrowthOpportunityStore,
  workflow: GrowthOpportunityWorkflowPort,
  input: OpenGrowthOpportunityInput
): Promise<OpenGrowthOpportunityResult> {
  const tenantId = input.tenantId?.trim();
  const personaId = input.personaId?.trim();
  if (!tenantId || !personaId) {
    return { ok: false, reason: "missing_tenant_or_persona" };
  }

  const now = input.now ?? new Date().toISOString();
  const subjectType: GrowthOpportunitySubjectType = input.subjectType ?? "none";
  const subjectId = input.subjectId?.trim() || undefined;

  const config = await resolveGrowthSpaceConfig(store, tenantId, now);
  if (!isAllowedOpportunityTypeKey(config, input.typeKey)) {
    return { ok: false, reason: "invalid_type_key" };
  }

  const existing = await store.findOpenBySubject({
    tenantId,
    personaId,
    typeKey: input.typeKey,
    subjectType,
    subjectId,
  });

  if (existing && !isGrowthOpportunityFinalStatus(existing.status)) {
    return { ok: true, outcome: "reused", oportunidad: existing };
  }

  // También revisar lista por si el índice/store no filtró finales
  const siblings = await store.listByPersona(tenantId, personaId);
  const reusable = siblings.find(
    (o) =>
      o.typeKey === input.typeKey &&
      sameSubject(o, subjectType, subjectId) &&
      !isGrowthOpportunityFinalStatus(o.status)
  );
  if (reusable) {
    return { ok: true, outcome: "reused", oportunidad: reusable };
  }

  const opportunityId = newId();
  const wf = await workflow.start({
    tenantId,
    entityId: opportunityId,
    metadata: { typeKey: input.typeKey, personaId },
  });

  const origin = buildGrowthOrigin(input.origin, now);
  const status = wf.currentState as GrowthOpportunityStatus;

  const oportunidad: GrowthOportunidad = {
    _id: opportunityId,
    tenantId,
    personaId,
    typeKey: input.typeKey,
    subjectType,
    ...(subjectId ? { subjectId } : {}),
    ...(input.subjectLabel?.trim()
      ? { subjectLabel: input.subjectLabel.trim() }
      : {}),
    origin,
    status,
    workflowInstanceId: wf.instanceId,
    nextAction: null,
    source: {
      sourceCollection: input.sourceCollection,
      sourceId: input.sourceId,
    },
    openedAt: now,
    updatedAt: now,
  };

  const saved = await store.insert(oportunidad);

  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId,
      personaId,
      oportunidadId: saved._id,
      kind: "opportunity_opened",
      summary: `Oportunidad abierta (${saved.typeKey})`,
      ingestKey: buildGrowthIngestKey(
        input.sourceCollection,
        input.sourceId,
        "opportunity_opened"
      ),
      sourceCollection: input.sourceCollection,
      sourceId: input.sourceId,
      payload: {
        typeKey: saved.typeKey,
        status: saved.status,
        workflowInstanceId: saved.workflowInstanceId,
      },
      actorUserId: input.actorUserId,
      occurredAt: now,
    },
    { eventBus: input.eventBus }
  );

  return {
    ok: true,
    outcome: "created",
    oportunidad: saved,
    activity: recorded.ok ? recorded.activity : undefined,
  };
}
