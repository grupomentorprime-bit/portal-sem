/**
 * OT-GROWTH-MESSAGING-001 — persistencia Mongo Conversación / Mensaje.
 * No toca Persona, Oportunidad, Actividad ni colecciones legacy.
 */

import type { Db } from "mongodb";
import { ensureGrowthMessagingIndexes } from "./indexes";
import type { GrowthMessagingStore } from "./store";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
  type GrowthConversation,
  type GrowthMessage,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthMessagingStore(db: Db): GrowthMessagingStore {
  const conversaciones = db.collection<GrowthConversation>(
    GROWTH_CONVERSACIONES_COLLECTION
  );
  const mensajes = db.collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION);

  return {
    async findConversationById(tenantId, conversationId) {
      return conversaciones.findOne({ tenantId, _id: conversationId });
    },

    async findConversationByExternalThread({
      tenantId,
      channel,
      externalThreadId,
    }) {
      return conversaciones.findOne({
        tenantId,
        channel,
        externalThreadId,
      });
    },

    async findOpenConversationByPersonaChannel({
      tenantId,
      personaId,
      channel,
    }) {
      return conversaciones.findOne({
        tenantId,
        personaId,
        channel,
        status: "open",
      });
    },

    async insertConversation(conversation) {
      const doc = omitUndefined({ ...conversation }) as GrowthConversation;
      await conversaciones.insertOne(doc);
      return doc;
    },

    async replaceConversation(conversation) {
      const doc = omitUndefined({ ...conversation }) as GrowthConversation;
      await conversaciones.replaceOne(
        { tenantId: doc.tenantId, _id: doc._id },
        doc
      );
      return doc;
    },

    async findMessageById(tenantId, messageId) {
      return mensajes.findOne({ tenantId, _id: messageId });
    },

    async findMessageByExternalId({ tenantId, channel, externalMessageId }) {
      return mensajes.findOne({ tenantId, channel, externalMessageId });
    },

    async findMessageByClientRequestId({ tenantId, clientRequestId }) {
      return mensajes.findOne({ tenantId, clientRequestId });
    },

    async findLatestInboundMessage({ tenantId, conversationId }) {
      return mensajes.findOne(
        { tenantId, conversationId, direction: "inbound" },
        { sort: { occurredAt: -1 } }
      );
    },

    async insertMessage(message) {
      if (message.externalMessageId) {
        const existing = await mensajes.findOne({
          tenantId: message.tenantId,
          channel: message.channel,
          externalMessageId: message.externalMessageId,
        });
        if (existing) return existing;
      }
      if (message.clientRequestId) {
        const existing = await mensajes.findOne({
          tenantId: message.tenantId,
          clientRequestId: message.clientRequestId,
        });
        if (existing) return existing;
      }

      const doc = omitUndefined({ ...message }) as GrowthMessage;
      try {
        await mensajes.insertOne(doc);
        return doc;
      } catch (error) {
        const code = (error as { code?: number }).code;
        if (code === 11000) {
          if (message.externalMessageId) {
            const existing = await mensajes.findOne({
              tenantId: message.tenantId,
              channel: message.channel,
              externalMessageId: message.externalMessageId,
            });
            if (existing) return existing;
          }
          if (message.clientRequestId) {
            const existing = await mensajes.findOne({
              tenantId: message.tenantId,
              clientRequestId: message.clientRequestId,
            });
            if (existing) return existing;
          }
        }
        throw error;
      }
    },

    async replaceMessage(message) {
      const doc = omitUndefined({ ...message }) as GrowthMessage;
      await mensajes.replaceOne(
        { tenantId: doc.tenantId, _id: doc._id },
        doc
      );
      return doc;
    },

    async setMessageEventId(tenantId, messageId, eventId) {
      const result = await mensajes.findOneAndUpdate(
        { tenantId, _id: messageId, eventId: { $exists: false } },
        { $set: { eventId } },
        { returnDocument: "after" }
      );
      if (result) return result;
      return mensajes.findOne({ tenantId, _id: messageId });
    },
  };
}

export async function openGrowthMessagingStore(
  db: Db
): Promise<GrowthMessagingStore> {
  await ensureGrowthMessagingIndexes(db);
  return createMongoGrowthMessagingStore(db);
}
