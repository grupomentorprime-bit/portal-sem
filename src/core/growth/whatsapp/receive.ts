/**
 * OT-GROWTH-MESSAGING-002 — webhook POST: autenticar, resolver Espacio/Persona, inbound.
 * Reutiliza upsertGrowthPersona + recordGrowthInboundMessage. Sin envío ni bandeja.
 */

import type { GrowthEventBusPort } from "../event-bus-port";
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
  eventBus?: GrowthEventBusPort;
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

/**
 * Autentica el webhook, resuelve Espacio por phone_number_id, Persona por teléfono
 * y llama a recordGrowthInboundMessage (idempotente por wamid).
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

  for (const extracted of messages) {
    const connection = await resolveUniqueConnection(
      deps.connections,
      extracted.phoneNumberId
    );
    if (!connection) {
      ignored += 1;
      continue;
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

    const inbound = await recordGrowthInboundMessage(
      deps.messaging,
      {
        tenantId: connection.tenantId,
        personaId: persona.personaId,
        channel: GROWTH_WHATSAPP_CHANNEL,
        body: extracted.body,
        externalMessageId: extracted.messageId,
        externalThreadId: `${extracted.phoneNumberId}:${extracted.from}`,
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
      inbound,
    });
  }

  return { ok: true, httpStatus: 200, processed, ignored };
}
