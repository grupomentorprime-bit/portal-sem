/**
 * OT-GROWTH-MESSAGING-001 — store en memoria (tests).
 */

import type { GrowthMessagingStore } from "./store";
import type { GrowthConversation, GrowthMessage } from "./types";

function key(tenantId: string, id: string) {
  return `${tenantId}::${id}`;
}

export function createMemoryGrowthMessagingStore(): GrowthMessagingStore & {
  conversations: Map<string, GrowthConversation>;
  messages: Map<string, GrowthMessage>;
} {
  const conversations = new Map<string, GrowthConversation>();
  const messages = new Map<string, GrowthMessage>();

  return {
    conversations,
    messages,

    async findConversationById(tenantId, conversationId) {
      const doc = conversations.get(key(tenantId, conversationId));
      return doc ? structuredClone(doc) : null;
    },

    async findConversationByExternalThread({
      tenantId,
      channel,
      externalThreadId,
    }) {
      for (const c of conversations.values()) {
        if (
          c.tenantId === tenantId &&
          c.channel === channel &&
          c.externalThreadId === externalThreadId
        ) {
          return structuredClone(c);
        }
      }
      return null;
    },

    async findOpenConversationByPersonaChannel({
      tenantId,
      personaId,
      channel,
    }) {
      for (const c of conversations.values()) {
        if (
          c.tenantId === tenantId &&
          c.personaId === personaId &&
          c.channel === channel &&
          c.status === "open"
        ) {
          return structuredClone(c);
        }
      }
      return null;
    },

    async insertConversation(conversation) {
      conversations.set(
        key(conversation.tenantId, conversation._id),
        structuredClone(conversation)
      );
      return structuredClone(conversation);
    },

    async replaceConversation(conversation) {
      conversations.set(
        key(conversation.tenantId, conversation._id),
        structuredClone(conversation)
      );
      return structuredClone(conversation);
    },

    async findMessageById(tenantId, messageId) {
      const doc = messages.get(key(tenantId, messageId));
      return doc ? structuredClone(doc) : null;
    },

    async findMessageByExternalId({ tenantId, channel, externalMessageId }) {
      for (const m of messages.values()) {
        if (
          m.tenantId === tenantId &&
          m.channel === channel &&
          m.externalMessageId === externalMessageId
        ) {
          return structuredClone(m);
        }
      }
      return null;
    },

    async findMessageByClientRequestId({ tenantId, clientRequestId }) {
      for (const m of messages.values()) {
        if (
          m.tenantId === tenantId &&
          m.clientRequestId === clientRequestId
        ) {
          return structuredClone(m);
        }
      }
      return null;
    },

    async findLatestInboundMessage({ tenantId, conversationId }) {
      let latest: GrowthMessage | null = null;
      for (const m of messages.values()) {
        if (
          m.tenantId !== tenantId ||
          m.conversationId !== conversationId ||
          m.direction !== "inbound"
        ) {
          continue;
        }
        if (!latest || m.occurredAt > latest.occurredAt) {
          latest = m;
        }
      }
      return latest ? structuredClone(latest) : null;
    },

    async insertMessage(message) {
      if (message.externalMessageId) {
        for (const existing of messages.values()) {
          if (
            existing.tenantId === message.tenantId &&
            existing.channel === message.channel &&
            existing.externalMessageId === message.externalMessageId
          ) {
            return structuredClone(existing);
          }
        }
      }
      if (message.clientRequestId) {
        for (const existing of messages.values()) {
          if (
            existing.tenantId === message.tenantId &&
            existing.clientRequestId === message.clientRequestId
          ) {
            return structuredClone(existing);
          }
        }
      }
      messages.set(
        key(message.tenantId, message._id),
        structuredClone(message)
      );
      return structuredClone(message);
    },

    async replaceMessage(message) {
      messages.set(
        key(message.tenantId, message._id),
        structuredClone(message)
      );
      return structuredClone(message);
    },

    async setMessageEventId(tenantId, messageId, eventId) {
      const k = key(tenantId, messageId);
      const existing = messages.get(k);
      if (!existing) return null;
      if (existing.eventId) return structuredClone(existing);
      const next = { ...existing, eventId };
      messages.set(k, next);
      return structuredClone(next);
    },
  };
}
