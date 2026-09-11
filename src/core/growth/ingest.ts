/**
 * OT-GROWTH-CORE-005 / ADR-010 §4 — proyección idempotente a Growth Core.
 * Fuente primero (fuera de este módulo); Growth es dual-write. Fallos no revierten captación.
 */

import { recordGrowthActivity } from "./activity";
import type { GrowthEventBusPort } from "./event-bus-port";
import { extractGrowthContactFromFormData } from "./ingest-contact";
import { buildGrowthIngestKey } from "./ingest-key";
import { openGrowthOpportunity } from "./open-opportunity";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthOpportunityWorkflowPort } from "./opportunity-workflow-port";
import type { GrowthPersonaStore } from "./store";
import {
  handOffGrowthOpportunity,
  transitionGrowthOpportunity,
} from "./transition-opportunity";
import type {
  GrowthActivity,
  GrowthBaseOpportunityTypeKey,
  GrowthOportunidad,
  GrowthOriginInput,
  GrowthOriginKind,
  GrowthPersona,
} from "./types";
import { upsertGrowthPersona } from "./upsert-persona";

export const GROWTH_V1_FORM_DESTINATIONS = [
  "contact",
  "information_request",
  "event_registration",
] as const;

export type GrowthV1FormDestination = (typeof GROWTH_V1_FORM_DESTINATIONS)[number];

export function isGrowthV1FormDestination(
  destination: string
): destination is GrowthV1FormDestination {
  return (GROWTH_V1_FORM_DESTINATIONS as readonly string[]).includes(destination);
}

export interface GrowthIngestDeps {
  personas: GrowthPersonaStore;
  oportunidades: GrowthOpportunityStore;
  workflow: GrowthOpportunityWorkflowPort;
  eventBus?: GrowthEventBusPort;
}

export interface GrowthAdmissionIngestInput {
  kind: "admission";
  tenantId: string;
  interesadoId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  programId: string;
  programLabel?: string;
  channel?: string;
  capturedAt?: string;
  handoff?: {
    delivered: boolean;
    externalId?: string;
    adapter?: string;
  };
}

export interface GrowthFormIngestInput {
  kind: "form";
  tenantId: string;
  submissionId: string;
  formId: string;
  destination: string;
  data: Record<string, unknown>;
  capturedAt?: string;
  channel?: string;
  campaign?: string;
  referrer?: string;
}

export type GrowthIngestInput = GrowthAdmissionIngestInput | GrowthFormIngestInput;

export type GrowthIngestResult =
  | {
      ok: true;
      outcome: "projected" | "idempotent_hit";
      persona: GrowthPersona;
      oportunidad: GrowthOportunidad;
      primaryActivity: GrowthActivity;
      skippedHandoff?: boolean;
    }
  | { ok: true; outcome: "skipped"; reason: "destination_out_of_scope" }
  | { ok: true; outcome: "skipped"; reason: "missing_identity" }
  | {
      ok: true;
      outcome: "identity_conflict";
      emailPersonaId: string;
      phonePersonaId: string;
      activity?: GrowthActivity;
    }
  | { ok: false; reason: "missing_source_id" | "open_opportunity_failed" };

const PORTAL_INTERESADOS = "portal_interesados";
const EXPERIENCE_FORM_SUBMISSIONS = "experience_form_submissions";

function mapFormDestination(
  destination: GrowthV1FormDestination
): {
  typeKey: GrowthBaseOpportunityTypeKey;
  originKind: GrowthOriginKind;
  activityKind: "form_submitted";
  summary: string;
} {
  if (destination === "event_registration") {
    return {
      typeKey: "registration",
      originKind: "event",
      activityKind: "form_submitted",
      summary: "Registro a evento recibido",
    };
  }
  return {
    typeKey: "inquiry",
    originKind: "form",
    activityKind: "form_submitted",
    summary:
      destination === "information_request"
        ? "Solicitud de información recibida"
        : "Contacto recibido",
  };
}

async function publishPersonaUpserted(
  eventBus: GrowthEventBusPort | undefined,
  persona: GrowthPersona,
  upsertOutcome: "created" | "matched"
): Promise<void> {
  if (!eventBus) return;
  try {
    await eventBus.publish({
      type: "GrowthPersonaUpserted",
      tenantId: persona.tenantId,
      entityType: "growth.persona",
      entityId: persona._id,
      payload: { outcome: upsertOutcome },
    });
  } catch {
    // Dual-write: fallo de bus no revierte proyección
  }
}

async function ensureOpportunityForSource(
  deps: GrowthIngestDeps,
  input: {
    tenantId: string;
    personaId: string;
    typeKey: string;
    origin: GrowthOriginInput;
    sourceCollection: string;
    sourceId: string;
    subjectType: "program" | "form" | "event" | "topic" | "none";
    subjectId?: string;
    subjectLabel?: string;
    now: string;
  }
): Promise<
  | { ok: true; oportunidad: GrowthOportunidad; created: boolean }
  | { ok: false }
> {
  const existing = await deps.oportunidades.findBySource(
    input.tenantId,
    input.sourceCollection,
    input.sourceId
  );
  if (existing) {
    return { ok: true, oportunidad: existing, created: false };
  }

  const opened = await openGrowthOpportunity(
    deps.oportunidades,
    deps.workflow,
    {
      tenantId: input.tenantId,
      personaId: input.personaId,
      typeKey: input.typeKey,
      origin: input.origin,
      sourceCollection: input.sourceCollection,
      sourceId: input.sourceId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectLabel: input.subjectLabel,
      now: input.now,
      eventBus: deps.eventBus,
    }
  );
  if (!opened.ok) return { ok: false };
  return {
    ok: true,
    oportunidad: opened.oportunidad,
    created: opened.outcome === "created",
  };
}

async function applyAdmissionHandoff(
  deps: GrowthIngestDeps,
  oportunidad: GrowthOportunidad,
  input: GrowthAdmissionIngestInput,
  now: string
): Promise<GrowthOportunidad> {
  if (!input.handoff?.delivered) return oportunidad;
  if (oportunidad.status === "handed_off") return oportunidad;

  let current = oportunidad;
  if (current.status === "open") {
    const activated = await transitionGrowthOpportunity(
      deps.oportunidades,
      deps.workflow,
      {
        tenantId: current.tenantId,
        oportunidadId: current._id,
        transitionId: "activate",
        sourceCollection: PORTAL_INTERESADOS,
        sourceId: `${input.interesadoId}:activate`,
        now,
        eventBus: deps.eventBus,
      }
    );
    if (!activated.ok) return current;
    current = activated.oportunidad;
  }

  if (current.status !== "active") return current;

  const handed = await handOffGrowthOpportunity(
    deps.oportunidades,
    deps.workflow,
    {
      tenantId: current.tenantId,
      oportunidadId: current._id,
      handoff: {
        interesadoId: input.interesadoId,
        delivered: true,
        ...(input.handoff.externalId
          ? { externalId: input.handoff.externalId }
          : {}),
        ...(input.handoff.adapter ? { adapter: input.handoff.adapter } : {}),
      },
      sourceCollection: PORTAL_INTERESADOS,
      sourceId: `${input.interesadoId}:hand_off`,
      now,
      eventBus: deps.eventBus,
    }
  );
  return handed.ok ? handed.oportunidad : current;
}

/**
 * Proyecta una señal de captación ya persistida a Persona / Oportunidad / Actividad.
 * Idempotente por ingestKey + findBySource. No toca la fuente.
 */
export async function projectGrowthFromSignal(
  deps: GrowthIngestDeps,
  input: GrowthIngestInput
): Promise<GrowthIngestResult> {
  if (input.kind === "form") {
    if (!isGrowthV1FormDestination(input.destination)) {
      return { ok: true, outcome: "skipped", reason: "destination_out_of_scope" };
    }
    if (!input.submissionId?.trim()) {
      return { ok: false, reason: "missing_source_id" };
    }
  } else if (!input.interesadoId?.trim()) {
    return { ok: false, reason: "missing_source_id" };
  }

  const tenantId = input.tenantId.trim();
  const now =
    (input.kind === "admission"
      ? input.capturedAt
      : input.capturedAt) ?? new Date().toISOString();

  const sourceCollection =
    input.kind === "admission" ? PORTAL_INTERESADOS : EXPERIENCE_FORM_SUBMISSIONS;
  const sourceId =
    input.kind === "admission" ? input.interesadoId : input.submissionId;
  const primaryKind =
    input.kind === "admission" ? "application_received" : "form_submitted";
  const primaryIngestKey = buildGrowthIngestKey(
    sourceCollection,
    sourceId,
    primaryKind
  );

  const existingPrimary = await deps.oportunidades.findActivityByIngestKey(
    tenantId,
    primaryIngestKey
  );
  if (existingPrimary) {
    const persona = await deps.personas.findById(
      tenantId,
      existingPrimary.personaId
    );
    const oportunidad = existingPrimary.oportunidadId
      ? await deps.oportunidades.findById(
          tenantId,
          existingPrimary.oportunidadId
        )
      : await deps.oportunidades.findBySource(
          tenantId,
          sourceCollection,
          sourceId
        );
    if (persona && oportunidad) {
      return {
        ok: true,
        outcome: "idempotent_hit",
        persona,
        oportunidad,
        primaryActivity: existingPrimary,
      };
    }
  }

  let contact =
    input.kind === "admission"
      ? {
          email: input.email,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: [input.firstName, input.lastName]
            .filter(Boolean)
            .join(" "),
        }
      : extractGrowthContactFromFormData(input.data);

  if (input.kind === "form" && !contact.email && !contact.phone) {
    return { ok: true, outcome: "skipped", reason: "missing_identity" };
  }

  let typeKey: GrowthBaseOpportunityTypeKey;
  let originKind: GrowthOriginKind;
  let activitySummary: string;
  let subjectType: "program" | "form" | "event" | "none";
  let subjectId: string | undefined;
  let subjectLabel: string | undefined;
  let formDestination: string | undefined;
  let formId: string | undefined;
  let channel: string | undefined;

  if (input.kind === "admission") {
    typeKey = "conversion";
    originKind = "admission";
    activitySummary = "Postulación / admisión recibida";
    subjectType = "program";
    subjectId = input.programId;
    subjectLabel = input.programLabel;
    channel = input.channel ?? "portal-admision";
  } else {
    if (!isGrowthV1FormDestination(input.destination)) {
      return { ok: true, outcome: "skipped", reason: "destination_out_of_scope" };
    }
    const mapped = mapFormDestination(input.destination);
    typeKey = mapped.typeKey;
    originKind = mapped.originKind;
    activitySummary = mapped.summary;
    subjectType = input.destination === "event_registration" ? "event" : "form";
    subjectId = input.formId;
    formId = input.formId;
    formDestination = input.destination;
    channel = input.channel ?? input.destination;
  }

  const origin: GrowthOriginInput = {
    kind: originKind,
    sourceCollection,
    sourceId,
    capturedAt: now,
    ...(channel ? { channel } : {}),
    ...(formId ? { formId } : {}),
    ...(formDestination ? { formDestination } : {}),
    ...(input.kind === "form" && input.campaign
      ? { campaign: input.campaign }
      : {}),
    ...(input.kind === "form" && input.referrer
      ? { referrer: input.referrer }
      : {}),
  };

  const upserted = await upsertGrowthPersona(
    deps.personas,
    {
      tenantId,
      email: contact.email,
      phone: contact.phone,
      firstName: contact.firstName,
      lastName: contact.lastName,
      displayName: contact.displayName,
      origin,
      sourceCollection,
      sourceId,
      now,
    },
    { eventBus: deps.eventBus }
  );

  if (!upserted.ok) {
    if (upserted.reason === "identity_conflict") {
      return {
        ok: true,
        outcome: "identity_conflict",
        emailPersonaId: upserted.emailPersonaId,
        phonePersonaId: upserted.phonePersonaId,
        activity: upserted.activity,
      };
    }
    return { ok: true, outcome: "skipped", reason: "missing_identity" };
  }

  await publishPersonaUpserted(deps.eventBus, upserted.persona, upserted.outcome);

  const ensured = await ensureOpportunityForSource(deps, {
    tenantId,
    personaId: upserted.persona._id,
    typeKey,
    origin,
    sourceCollection,
    sourceId,
    subjectType,
    subjectId,
    subjectLabel,
    now,
  });
  if (!ensured.ok) {
    return { ok: false, reason: "open_opportunity_failed" };
  }

  let oportunidad = ensured.oportunidad;

  const primary = await recordGrowthActivity(
    deps.oportunidades,
    {
      tenantId,
      personaId: upserted.persona._id,
      oportunidadId: oportunidad._id,
      kind: primaryKind,
      summary: activitySummary,
      ingestKey: primaryIngestKey,
      sourceCollection,
      sourceId,
      payload: {
        typeKey,
        ...(subjectId ? { subjectId } : {}),
        ...(input.kind === "form" ? { formId: input.formId, destination: input.destination } : {}),
        ...(input.kind === "admission"
          ? {
              programId: input.programId,
              handoffDelivered: Boolean(input.handoff?.delivered),
            }
          : {}),
      },
      occurredAt: now,
    },
    { eventBus: deps.eventBus }
  );

  if (!primary.ok) {
    return { ok: false, reason: "open_opportunity_failed" };
  }

  if (input.kind === "admission") {
    oportunidad = await applyAdmissionHandoff(deps, oportunidad, input, now);
  }

  return {
    ok: true,
    outcome: "projected",
    persona: upserted.persona,
    oportunidad,
    primaryActivity: primary.activity,
    skippedHandoff: input.kind === "admission" && !input.handoff?.delivered,
  };
}

/**
 * Fail-soft: nunca lanza. Uso desde captación (admisión / forms).
 */
export async function projectGrowthFromSignalSafe(
  deps: GrowthIngestDeps,
  input: GrowthIngestInput
): Promise<GrowthIngestResult | { ok: false; reason: "projection_error"; error: string }> {
  try {
    return await projectGrowthFromSignal(deps, input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Growth Core] projection failed (source preserved)", {
      kind: input.kind,
      tenantId: input.tenantId,
      error: message,
    });
    return { ok: false, reason: "projection_error", error: message };
  }
}
