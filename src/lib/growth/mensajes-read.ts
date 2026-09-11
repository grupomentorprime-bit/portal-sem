/**
 * OT-GROWTH-MESSAGING-004 — lectura tenant-scoped para bandeja /admin/mensajes.
 * Reutiliza colecciones de MESSAGING-001; no altera el motor de envío/recepción.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
  type GrowthConversation,
  type GrowthMessage,
} from "@/core/growth/messaging";
import {
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  type GrowthOportunidad,
  type GrowthPersona,
} from "@/core/growth";
import { getDatabase } from "@/lib/mongodb";
import { escapeGrowthSearchRegex } from "./persona-view";
import {
  formatMensajeWhen,
  growthConversationChannelLabel,
  isOutboundSendFailed,
  truncateMessagePreview,
  type GrowthMensajeThreadItemView,
  type GrowthMensajesListItemView,
  type GrowthMensajesThreadView,
} from "./mensajes-view";

export type {
  GrowthMensajeThreadItemView,
  GrowthMensajesListItemView,
  GrowthMensajesThreadView,
} from "./mensajes-view";

export {
  formatMensajeWhen,
  growthConversationChannelLabel,
  truncateMessagePreview,
} from "./mensajes-view";

export interface GrowthMensajesListFilters {
  q?: string;
  limit?: number;
}

async function personaIdsMatchingSearch(
  tenantId: string,
  q: string
): Promise<string[]> {
  const db = await getDatabase();
  const rx = new RegExp(escapeGrowthSearchRegex(q), "i");
  const personas = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .find(
      {
        tenantId,
        status: { $ne: "merged" },
        $or: [
          { displayName: rx },
          { email: rx },
          { phone: rx },
          { emailNormalized: rx },
          { phoneNormalized: rx },
        ],
      },
      { projection: { _id: 1 } }
    )
    .toArray();
  return personas.map((p) => p._id);
}

function personaDisplayName(persona: GrowthPersona | undefined): string {
  const name = persona?.displayName?.trim();
  if (name) return name;
  const email = persona?.email?.trim();
  if (email) return email;
  const phone = persona?.phone?.trim();
  if (phone) return phone;
  return "Persona";
}

async function loadPersonasByIds(
  tenantId: string,
  personaIds: string[]
): Promise<Map<string, GrowthPersona>> {
  if (personaIds.length === 0) return new Map();
  const db = await getDatabase();
  const rows = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .find({ tenantId, _id: { $in: personaIds } })
    .toArray();
  return new Map(rows.map((p) => [p._id, p]));
}

async function loadLatestMessagesByConversation(
  tenantId: string,
  conversationIds: string[]
): Promise<Map<string, GrowthMessage>> {
  const map = new Map<string, GrowthMessage>();
  if (conversationIds.length === 0) return map;
  const db = await getDatabase();
  const rows = await db
    .collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION)
    .find({ tenantId, conversationId: { $in: conversationIds } })
    .sort({ occurredAt: -1 })
    .toArray();
  for (const message of rows) {
    if (!map.has(message.conversationId)) {
      map.set(message.conversationId, message);
    }
  }
  return map;
}

export async function listGrowthMensajesInbox(
  tenantId: string,
  filters: GrowthMensajesListFilters = {}
): Promise<GrowthMensajesListItemView[]> {
  const db = await getDatabase();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  const filter: Filter<GrowthConversation> = {
    tenantId,
    status: { $ne: "archived" },
  };

  const q = filters.q?.trim();
  if (q) {
    const personaIds = await personaIdsMatchingSearch(tenantId, q);
    if (personaIds.length === 0) return [];
    filter.personaId = { $in: personaIds };
  }

  const conversations = await db
    .collection<GrowthConversation>(GROWTH_CONVERSACIONES_COLLECTION)
    .find(filter)
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(limit)
    .toArray();

  if (conversations.length === 0) return [];

  const personaIds = [...new Set(conversations.map((c) => c.personaId))];
  const conversationIds = conversations.map((c) => c._id);
  const now = new Date();

  const [personas, lastMessages] = await Promise.all([
    loadPersonasByIds(tenantId, personaIds),
    loadLatestMessagesByConversation(tenantId, conversationIds),
  ]);

  return conversations.map((conversation) => {
    const last = lastMessages.get(conversation._id);
    const whenIso = last?.occurredAt ?? conversation.lastMessageAt ?? conversation.updatedAt;
    return {
      id: conversation._id,
      personaId: conversation.personaId,
      personaName: personaDisplayName(personas.get(conversation.personaId)),
      channel: conversation.channel,
      channelLabel: growthConversationChannelLabel(conversation.channel),
      lastMessagePreview: truncateMessagePreview(last?.body ?? ""),
      timeLabel: formatMensajeWhen(whenIso, now),
    };
  });
}

export async function getGrowthMensajesThread(
  tenantId: string,
  conversationId: string
): Promise<GrowthMensajesThreadView | null> {
  const db = await getDatabase();
  const conversation = await db
    .collection<GrowthConversation>(GROWTH_CONVERSACIONES_COLLECTION)
    .findOne({ tenantId, _id: conversationId });
  if (!conversation) return null;

  const [persona, messages, oportunidad] = await Promise.all([
    db
      .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
      .findOne({ tenantId, _id: conversation.personaId }),
    db
      .collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION)
      .find({ tenantId, conversationId })
      .sort({ occurredAt: 1 })
      .limit(500)
      .toArray(),
    conversation.oportunidadId
      ? db
          .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
          .findOne(
            { tenantId, _id: conversation.oportunidadId },
            { projection: { _id: 1 } }
          )
      : Promise.resolve(null),
  ]);

  const now = new Date();
  const threadMessages: GrowthMensajeThreadItemView[] = messages.map((m) => ({
    id: m._id,
    direction: m.direction,
    body: m.body,
    timeLabel: formatMensajeWhen(m.occurredAt, now),
    ...(m.direction === "outbound" && isOutboundSendFailed(m.status)
      ? { sendFailed: true }
      : {}),
  }));

  return {
    id: conversation._id,
    personaId: conversation.personaId,
    personaName: personaDisplayName(persona ?? undefined),
    channel: conversation.channel,
    channelLabel: growthConversationChannelLabel(conversation.channel),
    ...(oportunidad?._id
      ? { oportunidadId: String(oportunidad._id) }
      : {}),
    messages: threadMessages,
  };
}
