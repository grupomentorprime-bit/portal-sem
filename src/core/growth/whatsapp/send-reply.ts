/**
 * OT-GROWTH-MESSAGING-003 — responder WhatsApp en conversación existente.
 * Envía por Cloud API con la conexión del Espacio; guarda saliente; no inventa plantillas.
 */

import { ObjectId } from "mongodb";
import type { GrowthEventBusPort } from "../event-bus-port";
import type { GrowthMessagingStore } from "../messaging/store";
import type {
  GrowthConversation,
  GrowthMessage,
} from "../messaging/types";
import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import type { WhatsAppCloudApiPort } from "./cloud-api";
import { createHttpWhatsAppCloudApi } from "./cloud-api";
import { GROWTH_WHATSAPP_CHANNEL } from "./types";
import {
  evaluateWhatsAppServiceWindow,
  parseWhatsAppRecipientFromThreadId,
} from "./window";

function newId(): string {
  return new ObjectId().toString();
}

/** Contrato de dominio: “Se envió un mensaje” (saliente). */
export const GROWTH_MESSAGE_SENT_EVENT = "GrowthMessageSent" as const;

export interface SendWhatsAppReplyInput {
  tenantId: string;
  conversationId: string;
  body: string;
  /** Idempotencia de reintento — mismo id no duplica un envío exitoso. */
  clientRequestId?: string;
  actorUserId?: string;
  now?: string;
}

export interface SendWhatsAppReplyDeps {
  messaging: GrowthMessagingStore;
  connections: GrowthWhatsAppConnectionStore;
  cloudApi?: WhatsAppCloudApiPort;
  eventBus?: GrowthEventBusPort;
}

export type SendWhatsAppReplyResult =
  | {
      ok: true;
      conversation: GrowthConversation;
      message: GrowthMessage;
      duplicated: boolean;
      published: boolean;
    }
  | { ok: false; reason: "missing_tenant" }
  | { ok: false; reason: "missing_body" }
  | { ok: false; reason: "conversation_not_found" }
  | { ok: false; reason: "not_whatsapp_conversation" }
  | { ok: false; reason: "connection_unavailable" }
  | { ok: false; reason: "recipient_unavailable" }
  | {
      ok: false;
      reason: "template_required";
      windowReason: "no_inbound" | "window_expired";
      lastInboundAt?: string;
      closesAt?: string;
      message: GrowthMessage;
    }
  | {
      ok: false;
      reason: "provider_rejected";
      message: GrowthMessage;
      failureCode?: string;
      failureDetail: string;
    };

function truncateDetail(value: string, max = 280): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function templateFailureDetail(
  windowReason: "no_inbound" | "window_expired"
): string {
  return windowReason === "no_inbound"
    ? "Sin mensaje entrante: la respuesta libre no está permitida; hace falta plantilla."
    : "Ventana de servicio cerrada: la respuesta libre no está permitida; hace falta plantilla.";
}

function asQueuedDraft(
  base: GrowthMessage,
  body: string,
  now: string
): GrowthMessage {
  const next: GrowthMessage = {
    _id: base._id,
    tenantId: base.tenantId,
    conversationId: base.conversationId,
    channel: base.channel,
    direction: "outbound",
    body,
    status: "queued",
    occurredAt: now,
    createdAt: base.createdAt,
  };
  if (base.clientRequestId) next.clientRequestId = base.clientRequestId;
  if (base.eventId) next.eventId = base.eventId;
  return next;
}

function asFailedDraft(
  base: GrowthMessage,
  body: string,
  now: string,
  failureCode: string,
  failureDetail: string
): GrowthMessage {
  const next: GrowthMessage = {
    _id: base._id,
    tenantId: base.tenantId,
    conversationId: base.conversationId,
    channel: base.channel,
    direction: "outbound",
    body,
    status: "failed",
    failureCode,
    failureDetail: truncateDetail(failureDetail),
    occurredAt: now,
    createdAt: base.createdAt,
  };
  if (base.clientRequestId) next.clientRequestId = base.clientRequestId;
  if (base.eventId) next.eventId = base.eventId;
  return next;
}

async function ensureOutboundDraft(
  messaging: GrowthMessagingStore,
  input: {
    tenantId: string;
    conversationId: string;
    body: string;
    clientRequestId?: string;
    now: string;
    existing?: GrowthMessage | null;
  }
): Promise<GrowthMessage> {
  if (input.existing) {
    return messaging.replaceMessage(
      asQueuedDraft(input.existing, input.body, input.now)
    );
  }
  return messaging.insertMessage({
    _id: newId(),
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    channel: GROWTH_WHATSAPP_CHANNEL,
    direction: "outbound",
    body: input.body,
    status: "queued",
    occurredAt: input.now,
    createdAt: input.now,
    ...(input.clientRequestId
      ? { clientRequestId: input.clientRequestId }
      : {}),
  });
}

async function publishSentEvent(
  eventBus: GrowthEventBusPort | undefined,
  messaging: GrowthMessagingStore,
  conversation: GrowthConversation,
  message: GrowthMessage,
  actorUserId?: string
): Promise<{ message: GrowthMessage; published: boolean }> {
  if (!eventBus || message.eventId) {
    return { message, published: false };
  }
  try {
    const publishedEvt = await eventBus.publish({
      type: GROWTH_MESSAGE_SENT_EVENT,
      tenantId: message.tenantId,
      entityType: "growth.message",
      entityId: message._id,
      ...(actorUserId ? { userId: actorUserId } : {}),
      payload: {
        conversationId: conversation._id,
        messageId: message._id,
        personaId: conversation.personaId,
        channel: conversation.channel,
        direction: "outbound",
        status: message.status,
        ...(conversation.oportunidadId
          ? { oportunidadId: conversation.oportunidadId }
          : {}),
        ...(message.externalMessageId
          ? { externalMessageId: message.externalMessageId }
          : {}),
        occurredAt: message.occurredAt,
      },
    });
    const withEvent =
      (await messaging.setMessageEventId(
        message.tenantId,
        message._id,
        publishedEvt.id
      )) ?? { ...message, eventId: publishedEvt.id };
    return { message: withEvent, published: true };
  } catch {
    return { message, published: false };
  }
}

/**
 * Envía respuesta de texto libre si la ventana de servicio está abierta.
 * Si Meta rechaza o falta conexión/número: no finge envío; conserva fallo; reintento idempotente.
 */
export async function sendWhatsAppReply(
  deps: SendWhatsAppReplyDeps,
  input: SendWhatsAppReplyInput
): Promise<SendWhatsAppReplyResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) return { ok: false, reason: "missing_tenant" };

  const body = input.body?.trim();
  if (!body) return { ok: false, reason: "missing_body" };

  const conversationId = input.conversationId?.trim();
  if (!conversationId) return { ok: false, reason: "conversation_not_found" };

  const now = input.now ?? new Date().toISOString();
  const clientRequestId = input.clientRequestId?.trim() || undefined;
  const cloudApi = deps.cloudApi ?? createHttpWhatsAppCloudApi();

  let existingByRequest: GrowthMessage | null = null;
  if (clientRequestId) {
    existingByRequest = await deps.messaging.findMessageByClientRequestId({
      tenantId,
      clientRequestId,
    });
    if (
      existingByRequest &&
      existingByRequest.conversationId !== conversationId
    ) {
      return { ok: false, reason: "conversation_not_found" };
    }
    if (
      existingByRequest &&
      (existingByRequest.status === "sent" ||
        existingByRequest.status === "delivered")
    ) {
      const conversation = await deps.messaging.findConversationById(
        tenantId,
        existingByRequest.conversationId
      );
      if (!conversation) {
        return { ok: false, reason: "conversation_not_found" };
      }
      return {
        ok: true,
        conversation,
        message: existingByRequest,
        duplicated: true,
        published: false,
      };
    }
  }

  const conversation = await deps.messaging.findConversationById(
    tenantId,
    conversationId
  );
  if (!conversation) return { ok: false, reason: "conversation_not_found" };
  if (conversation.channel !== GROWTH_WHATSAPP_CHANNEL) {
    return { ok: false, reason: "not_whatsapp_conversation" };
  }

  const connection = await deps.connections.findByTenantId(tenantId);
  if (
    !connection ||
    !connection.enabled ||
    connection.tenantId !== tenantId ||
    !connection.accessToken?.trim() ||
    !connection.phoneNumberId?.trim()
  ) {
    return { ok: false, reason: "connection_unavailable" };
  }

  const to = parseWhatsAppRecipientFromThreadId(conversation.externalThreadId);
  if (!to) return { ok: false, reason: "recipient_unavailable" };

  const lastInbound = await deps.messaging.findLatestInboundMessage({
    tenantId,
    conversationId: conversation._id,
  });
  const window = evaluateWhatsAppServiceWindow({ lastInbound, now });
  if (!window.open) {
    const detail = templateFailureDetail(window.reason);
    const message = existingByRequest
      ? await deps.messaging.replaceMessage(
          asFailedDraft(
            existingByRequest,
            body,
            now,
            "template_required",
            detail
          )
        )
      : await deps.messaging.insertMessage({
          _id: newId(),
          tenantId,
          conversationId: conversation._id,
          channel: GROWTH_WHATSAPP_CHANNEL,
          direction: "outbound",
          body,
          status: "failed",
          failureCode: "template_required",
          failureDetail: detail,
          occurredAt: now,
          createdAt: now,
          ...(clientRequestId ? { clientRequestId } : {}),
        });
    return {
      ok: false,
      reason: "template_required",
      windowReason: window.reason,
      ...(window.lastInboundAt ? { lastInboundAt: window.lastInboundAt } : {}),
      ...(window.closesAt ? { closesAt: window.closesAt } : {}),
      message,
    };
  }

  let draft = await ensureOutboundDraft(deps.messaging, {
    tenantId,
    conversationId: conversation._id,
    body,
    clientRequestId,
    now,
    existing: existingByRequest,
  });

  if (
    clientRequestId &&
    (draft.status === "sent" || draft.status === "delivered") &&
    draft.externalMessageId
  ) {
    return {
      ok: true,
      conversation,
      message: draft,
      duplicated: true,
      published: false,
    };
  }

  const sendResult = await cloudApi.sendTextMessage({
    phoneNumberId: connection.phoneNumberId,
    accessToken: connection.accessToken,
    to,
    body,
  });

  if (!sendResult.ok) {
    if (sendResult.templateRequired) {
      const failed = await deps.messaging.replaceMessage(
        asFailedDraft(
          draft,
          body,
          now,
          sendResult.code ?? "template_required",
          sendResult.message ||
            "Meta exige plantilla: la respuesta libre no está permitida."
        )
      );
      return {
        ok: false,
        reason: "template_required",
        windowReason: "window_expired",
        ...(window.lastInboundAt ? { lastInboundAt: window.lastInboundAt } : {}),
        ...(window.closesAt ? { closesAt: window.closesAt } : {}),
        message: failed,
      };
    }

    const failed = await deps.messaging.replaceMessage(
      asFailedDraft(
        draft,
        body,
        now,
        sendResult.code ?? "provider_rejected",
        sendResult.message || "Meta rechazó el envío."
      )
    );
    return {
      ok: false,
      reason: "provider_rejected",
      message: failed,
      ...(failed.failureCode ? { failureCode: failed.failureCode } : {}),
      failureDetail: failed.failureDetail ?? "Meta rechazó el envío.",
    };
  }

  const byExternal = await deps.messaging.findMessageByExternalId({
    tenantId,
    channel: GROWTH_WHATSAPP_CHANNEL,
    externalMessageId: sendResult.externalMessageId,
  });
  if (byExternal && byExternal._id !== draft._id) {
    await deps.messaging.replaceMessage(
      asFailedDraft(
        draft,
        body,
        now,
        "duplicate_external",
        "El mensaje ya existía con otro id interno."
      )
    );
    const published = await publishSentEvent(
      deps.eventBus,
      deps.messaging,
      conversation,
      byExternal,
      input.actorUserId
    );
    return {
      ok: true,
      conversation,
      message: published.message,
      duplicated: true,
      published: published.published,
    };
  }

  const sentBase: GrowthMessage = {
    _id: draft._id,
    tenantId: draft.tenantId,
    conversationId: draft.conversationId,
    channel: draft.channel,
    direction: "outbound",
    body,
    status: "sent",
    externalMessageId: sendResult.externalMessageId,
    occurredAt: now,
    createdAt: draft.createdAt,
  };
  if (draft.clientRequestId) sentBase.clientRequestId = draft.clientRequestId;
  if (draft.eventId) sentBase.eventId = draft.eventId;

  const sent = await deps.messaging.replaceMessage(sentBase);

  const touched = await deps.messaging.replaceConversation({
    ...conversation,
    updatedAt: now,
    lastMessageAt: now,
  });

  const published = await publishSentEvent(
    deps.eventBus,
    deps.messaging,
    touched,
    sent,
    input.actorUserId
  );

  return {
    ok: true,
    conversation: touched,
    message: published.message,
    duplicated: false,
    published: published.published,
  };
}
