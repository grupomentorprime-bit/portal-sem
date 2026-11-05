/**
 * OT-GROWTH-CORE-003/004 / ADR-010 §1.3 · §4.3 — abrir o reutilizar Oportunidad.
 * Una Persona → N Oportunidades. Reuso si misma typeKey+asunto y status no final.
 * Al crear: Actividad opportunity_opened vía recordGrowthActivity (+ Event Bus).
 */

import { ObjectId } from "mongodb";
import { recordGrowthActivity } from "./activity";
import { setGrowthNextAction } from "./next-action";
import type { GrowthEventBusPort } from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import type { GrowthFunnelDirectory } from "./funnel-directory";
import { growthOpportunityDefinitionKey } from "./funnel-types";
import { resolveCaptureFunnelKey } from "./funnels";
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
  GrowthNextActionKind,
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
  /** Embudo del Espacio. Sin valor, usa el predeterminado. */
  funnelKey?: string;
  /** Si no hay funnelKey, resuelve el embudo predeterminado activo del Espacio. */
  funnelDirectory?: GrowthFunnelDirectory;
  now?: string;
  actorUserId?: string;
  eventBus?: GrowthEventBusPort;
  initialNextAction?: {
    summary: string;
    kind: GrowthNextActionKind;
    sourceKey: string;
  };
}

export type OpenGrowthOpportunityResult =
  | {
      ok: true;
      outcome: "created" | "reused";
      oportunidad: GrowthOportunidad;
      activity?: GrowthActivity;
    }
  | { ok: false; reason: "invalid_type_key" }
  | { ok: false; reason: "missing_tenant_or_persona" }
  | { ok: false; reason: "missing_default_funnel" };

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
  const requestedFunnel = input.funnelKey?.trim() || "";
  let funnelKey = requestedFunnel || "default";
  if (!requestedFunnel && input.funnelDirectory) {
    const resolved = await resolveCaptureFunnelKey(
      input.funnelDirectory,
      tenantId
    );
    if (!resolved) return { ok: false, reason: "missing_default_funnel" };
    funnelKey = resolved;
  }
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
    funnelKey,
  });

  if (existing && !isGrowthOpportunityFinalStatus(existing.status)) {
    return { ok: true, outcome: "reused", oportunidad: existing };
  }

  // También revisar lista por si el índice/store no filtró finales
  const siblings = await store.listByPersona(tenantId, personaId);
  const reusable = siblings.find(
    (o) =>
      o.typeKey === input.typeKey &&
      (o.funnelKey || "default") === funnelKey &&
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
    definitionKey: growthOpportunityDefinitionKey(funnelKey),
    metadata: { typeKey: input.typeKey, personaId, funnelKey },
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
    funnelKey,
    organizationId: null,
    workflowInstanceId: wf.instanceId,
    nextAction: input.initialNextAction
      ? {
          summary: input.initialNextAction.summary,
          kind: input.initialNextAction.kind,
          sourceKey: input.initialNextAction.sourceKey,
          setAt: now,
        }
      : null,
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

  if (input.initialNextAction) {
    const traced = await setGrowthNextAction(store, {
      tenantId,
      oportunidadId: saved._id,
      summary: input.initialNextAction.summary,
      kind: input.initialNextAction.kind,
      sourceKey: input.initialNextAction.sourceKey,
      now,
      actorUserId: input.actorUserId,
      eventBus: input.eventBus,
    });
    return {
      ok: true,
      outcome: "created",
      oportunidad: traced.ok ? traced.oportunidad : saved,
      activity: recorded.ok ? recorded.activity : undefined,
    };
  }

  return {
    ok: true,
    outcome: "created",
    oportunidad: saved,
    activity: recorded.ok ? recorded.activity : undefined,
  };
}
