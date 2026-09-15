/**
 * OT-GROWTH-MESSAGING-002 / E2E-FIX-002 — webhook POST: autenticar, Persona,
 * Oportunidad comercial (open/reuse), Conversación vinculada, inbound.
 * Reutiliza upsertGrowthPersona + openGrowthOpportunity + recordGrowthInboundMessage.
 * Sin segundo pipeline ni automatización especial WhatsApp.
 */

import type { GrowthEventBusPort } from "../event-bus-port";
import { isGrowthOpportunityFinalStatus } from "../opportunity-definition";
import { openGrowthOpportunity } from "../open-opportunity";
import type { GrowthOpportunityStore } from "../opportunity-store";
import type { GrowthOpportunityWorkflowPort } from "../opportunity-workflow-port";
import {
  recordGrowthInboundMessage,
  type RecordGrowthInboundMessageResult,
} from "../messaging/record-inbound-message";
import type { GrowthMessagingStore } from "../messaging/store";
import { upsertGrowthPersona } from "../upsert-persona";
import type { GrowthPersonaStore } from "../store";
import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import { verifyWhatsAppHubSignature } from "./crypto";
import {
  collectWhatsAppPhoneNumberIds,
  extractWhatsAppInboundMessages,
  occurredAtFromWhatsAppTimestamp,
} from "./parse";
import {
  GROWTH_WHATSAPP_CHANNEL,
  GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY,
  GROWTH_WHATSAPP_SOURCE_COLLECTION,
  type GrowthWhatsAppConnection,
  type WhatsAppInboundExtracted,
} from "./types";

export interface ReceiveWhatsAppCloudWebhookInput {
  rawBody: string;
  signatureHeader?: string | null;
  now?: string;
}

export interface ReceiveWhatsAppCloudWebhookDeps {
  connections: GrowthWhatsAppConnectionStore;
  personas: GrowthPersonaStore;
  messaging: GrowthMessagingStore;
  /** Cableado comercial (E2E-FIX-002). Sin ellos → solo Persona + Conversación. */
  oportunidades?: GrowthOpportunityStore;
  workflow?: GrowthOpportunityWorkflowPort;
  eventBus?: GrowthEventBusPort;
  /**
   * Fail-soft: se invoca al resolver el Espacio, antes de abrir Oportunidad
   * (p. ej. ensure del playbook H1). Errores no deben tumbar el inbound.
   */
  onTenantResolved?: (tenantId: string) => Promise<void>;
}

export type ReceiveWhatsAppCloudWebhookResult =
  | {
      ok: true;
      httpStatus: 200;
      processed: WhatsAppReceiveItem[];
      ignored: number;
    }
  | { ok: false; httpStatus: 400; reason: "invalid_payload" }
  | { ok: false; httpStatus: 403; reason: "invalid_signature" }
  | { ok: false; httpStatus: 403; reason: "unknown_phone_number" };

export interface WhatsAppReceiveItem {
  messageId: string;
  tenantId: string;
  personaId: string;
  personaCreated: boolean;
  conversationCreated: boolean;
  duplicated: boolean;
  published: boolean;
  oportunidadId?: string;
  opportunityCreated?: boolean;
  opportunityReused?: boolean;
  inbound: RecordGrowthInboundMessageResult;
}

function parseJsonPayload(rawBody: string): unknown | null {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function resolveUniqueConnection(
  store: GrowthWhatsAppConnectionStore,
  phoneNumberId: string
): Promise<GrowthWhatsAppConnection | null> {
  return store.findEnabledByPhoneNumberId(phoneNumberId);
}

async function authenticatePayload(
  store: GrowthWhatsAppConnectionStore,
  rawBody: string,
  signatureHeader: string | null | undefined,
  payload: unknown
): Promise<
  | { ok: true }
  | { ok: false; reason: "invalid_signature" | "unknown_phone_number" }
> {
  const phoneNumberIds = collectWhatsAppPhoneNumberIds(payload);
  if (phoneNumberIds.length === 0) {
    return { ok: false, reason: "unknown_phone_number" };
  }

  const secrets: string[] = [];
  let resolved = 0;
  for (const phoneNumberId of phoneNumberIds) {
    const connection = await resolveUniqueConnection(store, phoneNumberId);
    if (!connection) continue;
    resolved += 1;
    if (!secrets.includes(connection.appSecret)) {
      secrets.push(connection.appSecret);
    }
  }

  if (resolved === 0) {
    return { ok: false, reason: "unknown_phone_number" };
  }

  const signed = secrets.some((secret) =>
    verifyWhatsAppHubSignature(rawBody, signatureHeader, secret)
  );
  if (!signed) {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true };
}

async function resolvePersonaForInbound(
  personas: GrowthPersonaStore,
  extracted: WhatsAppInboundExtracted,
  tenantId: string,
  now: string
): Promise<
  | { ok: true; personaId: string; created: boolean }
  | { ok: false }
> {
  const result = await upsertGrowthPersona(personas, {
    tenantId,
    phone: extracted.from,
    displayName: extracted.profileName,
    origin: {
      kind: "unknown",
      channel: GROWTH_WHATSAPP_CHANNEL,
      sourceCollection: GROWTH_WHATSAPP_SOURCE_COLLECTION,
      sourceId: `${extracted.phoneNumberId}:${extracted.from}`,
    },
    sourceCollection: GROWTH_WHATSAPP_SOURCE_COLLECTION,
    sourceId: extracted.messageId,
    now,
  });

  if (!result.ok) return { ok: false };
  return {
    ok: true,
    personaId: result.persona._id,
    created: result.outcome === "created",
  };
}

function whatsappThreadId(extracted: WhatsAppInboundExtracted): string {
  return `${extracted.phoneNumberId}:${extracted.from}`;
}

/**
 * Resuelve Oportunidad comercial para el inbound WhatsApp.
 * 1) Si el hilo ya apunta a una opp abierta → reutilizarla.
 * 2) Si no → openGrowthOpportunity (inquiry / none) con reglas existentes
 *    (reusa compatible no final; crea si la previa está won/lost/handed_off/archived).
 */
async function resolveOpportunityForInbound(
  deps: {
    oportunidades: GrowthOpportunityStore;
    workflow: GrowthOpportunityWorkflowPort;
    messaging: GrowthMessagingStore;
    eventBus?: GrowthEventBusPort;
  },
  input: {
    tenantId: string;
    personaId: string;
    extracted: WhatsAppInboundExtracted;
    now: string;
  }
): Promise<
  | { ok: true; oportunidadId: string; created: boolean; reused: boolean }
  | { ok: false }
> {
  const externalThreadId = whatsappThreadId(input.extracted);

  const existingConv =
    (await deps.messaging.findConversationByExternalThread({
      tenantId: input.tenantId,
      channel: GROWTH_WHATSAPP_CHANNEL,
      externalThreadId,
    })) ??
    (await deps.messaging.findOpenConversationByPersonaChannel({
      tenantId: input.tenantId,
      personaId: input.personaId,
      channel: GROWTH_WHATSAPP_CHANNEL,
    }));

  if (existingConv?.oportunidadId) {
    const linked = await deps.oportunidades.findById(
      input.tenantId,
      existingConv.oportunidadId
    );
    if (linked && !isGrowthOpportunityFinalStatus(linked.status)) {
      return {
        ok: true,
        oportunidadId: linked._id,
        created: false,
        reused: true,
      };
    }
  }

  const opened = await openGrowthOpportunity(
    deps.oportunidades,
    deps.workflow,
    {
      tenantId: input.tenantId,
      personaId: input.personaId,
      typeKey: GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY,
      subjectType: "none",
      origin: {
        kind: "unknown",
        channel: GROWTH_WHATSAPP_CHANNEL,
        sourceCollection: GROWTH_WHATSAPP_SOURCE_COLLECTION,
        sourceId: externalThreadId,
      },
      sourceCollection: GROWTH_WHATSAPP_SOURCE_COLLECTION,
      sourceId: input.extracted.messageId,
      now: input.now,
      eventBus: deps.eventBus,
    }
  );

  if (!opened.ok) return { ok: false };
  return {
    ok: true,
    oportunidadId: opened.oportunidad._id,
    created: opened.outcome === "created",
    reused: opened.outcome === "reused",
  };
}

/**
 * Autentica el webhook, resuelve Espacio por phone_number_id, Persona por teléfono,
 * abre/reutiliza Oportunidad comercial, vincula Conversación y registra inbound.
 */
export async function receiveWhatsAppCloudWebhook(
  deps: ReceiveWhatsAppCloudWebhookDeps,
  input: ReceiveWhatsAppCloudWebhookInput
): Promise<ReceiveWhatsAppCloudWebhookResult> {
  const rawBody = input.rawBody;
  if (!rawBody?.trim()) {
    return { ok: false, httpStatus: 400, reason: "invalid_payload" };
  }

  const payload = parseJsonPayload(rawBody);
  if (payload == null || typeof payload !== "object") {
    return { ok: false, httpStatus: 400, reason: "invalid_payload" };
  }

  const auth = await authenticatePayload(
    deps.connections,
    rawBody,
    input.signatureHeader,
    payload
  );
  if (!auth.ok) {
    return { ok: false, httpStatus: 403, reason: auth.reason };
  }

  const now = input.now ?? new Date().toISOString();
  const messages = extractWhatsAppInboundMessages(payload);
  const processed: WhatsAppReceiveItem[] = [];
  let ignored = 0;
  const commercial =
    deps.oportunidades && deps.workflow
      ? { oportunidades: deps.oportunidades, workflow: deps.workflow }
      : null;

  for (const extracted of messages) {
    const connection = await resolveUniqueConnection(
      deps.connections,
      extracted.phoneNumberId
    );
    if (!connection) {
      ignored += 1;
      continue;
    }

    if (deps.onTenantResolved) {
      try {
        await deps.onTenantResolved(connection.tenantId);
      } catch {
        // Fail-soft: inbound y Oportunidad siguen.
      }
    }

    const persona = await resolvePersonaForInbound(
      deps.personas,
      extracted,
      connection.tenantId,
      now
    );
    if (!persona.ok) {
      ignored += 1;
      continue;
    }

    let oportunidadId: string | undefined;
    let opportunityCreated: boolean | undefined;
    let opportunityReused: boolean | undefined;

    if (commercial) {
      const opportunity = await resolveOpportunityForInbound(
        {
          ...commercial,
          messaging: deps.messaging,
          eventBus: deps.eventBus,
        },
        {
          tenantId: connection.tenantId,
          personaId: persona.personaId,
          extracted,
          now,
        }
      );
      if (opportunity.ok) {
        oportunidadId = opportunity.oportunidadId;
        opportunityCreated = opportunity.created;
        opportunityReused = opportunity.reused;
      }
      // Fail-soft: si no hay opp, el mensaje igual entra al hilo.
    }

    const inbound = await recordGrowthInboundMessage(
      deps.messaging,
      {
        tenantId: connection.tenantId,
        personaId: persona.personaId,
        channel: GROWTH_WHATSAPP_CHANNEL,
        body: extracted.body,
        externalMessageId: extracted.messageId,
        externalThreadId: whatsappThreadId(extracted),
        ...(oportunidadId ? { oportunidadId } : {}),
        occurredAt: occurredAtFromWhatsAppTimestamp(extracted.timestamp, now),
      },
      { eventBus: deps.eventBus }
    );

    if (!inbound.ok) {
      ignored += 1;
      continue;
    }

    processed.push({
      messageId: extracted.messageId,
      tenantId: connection.tenantId,
      personaId: persona.personaId,
      personaCreated: persona.created,
      conversationCreated: inbound.conversationCreated,
      duplicated: inbound.duplicated,
      published: inbound.published,
      ...(oportunidadId
        ? {
            oportunidadId,
            opportunityCreated,
            opportunityReused,
          }
        : {}),
      inbound,
    });
  }

  return { ok: true, httpStatus: 200, processed, ignored };
}
