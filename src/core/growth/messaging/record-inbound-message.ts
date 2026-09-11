/**
 * OT-GROWTH-MESSAGING-001 — mensaje entrante + hecho de dominio GrowthMessageReceived.
 * Persistencia primero; fallo del Event Bus no borra el mensaje (mismo patrón Actividad).
 */

import { ObjectId } from "mongodb";
import type { GrowthEventBusPort } from "../event-bus-port";
import { ensureGrowthConversation } from "./ensure-conversation";
import type { GrowthMessagingStore } from "./store";
import type {
  GrowthConversation,
  GrowthConversationChannel,
  GrowthMessage,
} from "./types";
import { isGrowthConversationChannel } from "./types";

function newId(): string {
  return new ObjectId().toString();
}

/** Contrato de dominio: “Se recibió un mensaje” (sin Meta). */
export const GROWTH_MESSAGE_RECEIVED_EVENT = "GrowthMessageReceived" as const;

export interface RecordGrowthInboundMessageInput {
  tenantId: string;
  personaId: string;
  channel: GrowthConversationChannel;
  body: string;
  /** Id externo del mensaje — clave de idempotencia cuando existe. */
  externalMessageId?: string;
  externalThreadId?: string;
  oportunidadId?: string;
  /** Si ya se resolvió el hilo. */
  conversationId?: string;
  occurredAt?: string;
}

export interface RecordGrowthInboundMessageOptions {
  eventBus?: GrowthEventBusPort;
}

export type RecordGrowthInboundMessageResult =
  | {
      ok: true;
      conversation: GrowthConversation;
      message: GrowthMessage;
      duplicated: boolean;
      published: boolean;
      conversationCreated: boolean;
    }
  | { ok: false; reason: "missing_tenant_or_persona" }
  | { ok: false; reason: "invalid_channel" }
  | { ok: false; reason: "missing_body" }
  | { ok: false; reason: "conversation_not_found" }
  | { ok: false; reason: "conversation_mismatch" };

/**
 * Crea/reutiliza Conversación, guarda mensaje entrante y publica GrowthMessageReceived.
 * Mismo externalMessageId en el mismo Espacio+canal → no duplica ni republica.
 */
export async function recordGrowthInboundMessage(
  store: GrowthMessagingStore,
  input: RecordGrowthInboundMessageInput,
  options?: RecordGrowthInboundMessageOptions
): Promise<RecordGrowthInboundMessageResult> {
  const tenantId = input.tenantId?.trim();
  const personaId = input.personaId?.trim();
  if (!tenantId || !personaId) {
    return { ok: false, reason: "missing_tenant_or_persona" };
  }
  if (!isGrowthConversationChannel(input.channel)) {
    return { ok: false, reason: "invalid_channel" };
  }
  const body = input.body?.trim();
  if (!body) {
    return { ok: false, reason: "missing_body" };
  }

  const now = input.occurredAt ?? new Date().toISOString();
  const externalMessageId = input.externalMessageId?.trim() || undefined;

  if (externalMessageId) {
    const existingMsg = await store.findMessageByExternalId({
      tenantId,
      channel: input.channel,
      externalMessageId,
    });
    if (existingMsg) {
      const conversation = await store.findConversationById(
        tenantId,
        existingMsg.conversationId
      );
      if (!conversation) {
        return { ok: false, reason: "conversation_not_found" };
      }
      return {
        ok: true,
        conversation,
        message: existingMsg,
        duplicated: true,
        published: false,
        conversationCreated: false,
      };
    }
  }

  let conversation: GrowthConversation;
  let conversationCreated = false;

  if (input.conversationId?.trim()) {
    const found = await store.findConversationById(
      tenantId,
      input.conversationId.trim()
    );
    if (!found) return { ok: false, reason: "conversation_not_found" };
    if (found.personaId !== personaId || found.channel !== input.channel) {
      return { ok: false, reason: "conversation_mismatch" };
    }
    conversation = found;
  } else {
    const ensured = await ensureGrowthConversation(store, {
      tenantId,
      personaId,
      channel: input.channel,
      oportunidadId: input.oportunidadId,
      externalThreadId: input.externalThreadId,
      now,
    });
    if (!ensured.ok) {
      return { ok: false, reason: ensured.reason };
    }
    conversation = ensured.conversation;
    conversationCreated = ensured.created;
  }

  const draft: GrowthMessage = {
    _id: newId(),
    tenantId,
    conversationId: conversation._id,
    channel: conversation.channel,
    direction: "inbound",
    body,
    status: "received",
    occurredAt: now,
    createdAt: now,
    ...(externalMessageId ? { externalMessageId } : {}),
  };

  const saved = await store.insertMessage(draft);
  const duplicated = saved._id !== draft._id;

  if (!duplicated) {
    const touched: GrowthConversation = {
      ...conversation,
      updatedAt: now,
      lastMessageAt: now,
    };
    conversation = await store.replaceConversation(touched);
  }

  if (saved.eventId) {
    return {
      ok: true,
      conversation,
      message: saved,
      duplicated: true,
      published: false,
      conversationCreated,
    };
  }

  const eventBus = options?.eventBus;
  if (!eventBus || duplicated) {
    return {
      ok: true,
      conversation,
      message: saved,
      duplicated,
      published: false,
      conversationCreated,
    };
  }

  try {
    const publishedEvt = await eventBus.publish({
      type: GROWTH_MESSAGE_RECEIVED_EVENT,
      tenantId: saved.tenantId,
      entityType: "growth.message",
      entityId: saved._id,
      payload: {
        conversationId: conversation._id,
        messageId: saved._id,
        personaId: conversation.personaId,
        channel: conversation.channel,
        direction: saved.direction,
        ...(conversation.oportunidadId
          ? { oportunidadId: conversation.oportunidadId }
          : {}),
        ...(saved.externalMessageId
          ? { externalMessageId: saved.externalMessageId }
          : {}),
        occurredAt: saved.occurredAt,
      },
    });

    const withEvent =
      (await store.setMessageEventId(
        saved.tenantId,
        saved._id,
        publishedEvt.id
      )) ?? { ...saved, eventId: publishedEvt.id };

    return {
      ok: true,
      conversation,
      message: withEvent,
      duplicated: false,
      published: true,
      conversationCreated,
    };
  } catch {
    return {
      ok: true,
      conversation,
      message: saved,
      duplicated: false,
      published: false,
      conversationCreated,
    };
  }
}
