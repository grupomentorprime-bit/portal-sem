/**
 * OT-GROWTH-CORE-007 / OT-GROWTH-PERSONAS-IMPLEMENT-003 —
 * lectura Mongo tenant-scoped para UI de Personas.
 * Reutiliza stores Core (002/003) donde existen; listado/búsqueda sobre growth_*.
 * Paginación V1: limit 1–200 (default 100). Sin cursor pagination.
 */

import "server-only";

import type { Db, Filter } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  createMongoGrowthOpportunityStore,
  createMongoGrowthPersonaStore,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthOpportunityStatus,
  type GrowthPersona,
} from "@/core/growth";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
  type GrowthConversation,
  type GrowthMessage,
} from "@/core/growth/messaging";
import { getDatabase } from "@/lib/mongodb";
import {
  humanizeOriginDisplayLabel,
  isKnownHumanOriginChannel,
} from "./humanize-origin-display";
import type { GrowthPersonaOriginFilterToken } from "./labels";
import {
  formatMensajeWhen,
  growthConversationChannelLabel,
  truncateMessagePreview,
} from "./mensajes-view";
import { buildPersonaOriginMongoFilter } from "./personas-origin-filter";
import {
  escapeGrowthSearchRegex,
  toOportunidadDetailView,
  toPersonaDetailView,
  toPersonaListItemView,
  type GrowthOportunidadDetailView,
  type GrowthPersonaConversationView,
  type GrowthPersonaDetailView,
  type GrowthPersonaListItemView,
} from "./persona-view";

/** Presentación: mismo humanize que Ventas; no toca valores persistidos. */
function presentPersonaListItem(
  view: GrowthPersonaListItemView
): GrowthPersonaListItemView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
  };
}

function presentPersonaDetail(
  view: GrowthPersonaDetailView
): GrowthPersonaDetailView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
    oportunidades: view.oportunidades.map((o) => ({
      ...o,
      originLabel: humanizeOriginDisplayLabel(o.originLabel),
    })),
  };
}

function presentOportunidadDetail(
  view: GrowthOportunidadDetailView
): GrowthOportunidadDetailView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
  };
}

export type {
  GrowthActivityView,
  GrowthNextActionView,
  GrowthOportunidadDetailView,
  GrowthOportunidadView,
  GrowthPersonaConversationView,
  GrowthPersonaDetailView,
  GrowthPersonaListItemView,
} from "./persona-view";

export {
  activitiesVisibleInUi,
  escapeGrowthSearchRegex,
  personaMatchesSearch,
  pickPrimaryNextAction,
  sortActivitiesNewestFirst,
  toActivityView,
  toOportunidadDetailView,
  toOportunidadView,
  toPersonaDetailView,
  toPersonaListItemView,
} from "./persona-view";

export type GrowthPersonaOriginFilter = GrowthPersonaOriginFilterToken | string;

export interface GrowthPersonasListFilters {
  q?: string;
  opportunityType?: string;
  opportunityStatus?: GrowthOpportunityStatus | string;
  /** Token UI de origen V1 (§5.3). */
  origin?: GrowthPersonaOriginFilter;
  limit?: number;
}

const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  open: "Abierta",
  closed: "Cerrada",
  archived: "Archivada",
};

export { buildPersonaOriginMongoFilter } from "./personas-origin-filter";

async function personaIdsMatchingOpportunityFilters(
  db: Db,
  tenantId: string,
  filters: GrowthPersonasListFilters
): Promise<string[] | null> {
  const typeKey = filters.opportunityType?.trim();
  const status = filters.opportunityStatus?.trim();
  if (!typeKey && !status) return null;

  const filter: Filter<GrowthOportunidad> = { tenantId };
  if (typeKey) filter.typeKey = typeKey;
  if (status) filter.status = status as GrowthOpportunityStatus;

  const rows = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find(filter, { projection: { personaId: 1 } })
    .toArray();

  return [...new Set(rows.map((r) => r.personaId))];
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

/**
 * Proyección READ-ONLY de conversaciones de una Persona (Mensajes dueño).
 * Siempre tenantId + personaId.
 */
export async function listPersonaConversationViews(
  tenantId: string,
  personaId: string,
  limit = 20
): Promise<GrowthPersonaConversationView[]> {
  const db = await getDatabase();
  const conversations = await db
    .collection<GrowthConversation>(GROWTH_CONVERSACIONES_COLLECTION)
    .find({ tenantId, personaId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .toArray();

  if (conversations.length === 0) return [];

  const lastMessages = await loadLatestMessagesByConversation(
    tenantId,
    conversations.map((c) => c._id)
  );
  const now = new Date();

  return conversations.map((conversation) => {
    const last = lastMessages.get(conversation._id);
    const whenIso =
      last?.occurredAt ?? conversation.lastMessageAt ?? conversation.updatedAt;
    return {
      id: conversation._id,
      channelLabel: growthConversationChannelLabel(conversation.channel),
      statusLabel: CONVERSATION_STATUS_LABELS[conversation.status],
      lastMessageAt: conversation.lastMessageAt ?? last?.occurredAt,
      lastMessagePreview: truncateMessagePreview(last?.body ?? ""),
      timeLabel: formatMensajeWhen(whenIso, now),
    };
  });
}

export async function listGrowthPersonaViews(
  tenantId: string,
  filters: GrowthPersonasListFilters = {}
): Promise<GrowthPersonaListItemView[]> {
  const db = await getDatabase();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);

  const opportunityPersonaIds = await personaIdsMatchingOpportunityFilters(
    db,
    tenantId,
    filters
  );
  if (opportunityPersonaIds && opportunityPersonaIds.length === 0) {
    return [];
  }

  const personaFilter: Filter<GrowthPersona> = {
    tenantId,
    status: { $ne: "merged" },
  };
  if (opportunityPersonaIds) {
    personaFilter._id = { $in: opportunityPersonaIds };
  }

  const originFilter = buildPersonaOriginMongoFilter(filters.origin);
  if (originFilter) {
    Object.assign(personaFilter, originFilter);
  }

  const q = filters.q?.trim();
  if (q) {
    const rx = new RegExp(escapeGrowthSearchRegex(q), "i");
    personaFilter.$or = [
      { displayName: rx },
      { email: rx },
      { phone: rx },
      { emailNormalized: rx },
      { phoneNormalized: rx },
    ];
  }

  const personas = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .find(personaFilter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  if (personas.length === 0) return [];

  const ids = personas.map((p) => p._id);
  const oportunidades = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find({ tenantId, personaId: { $in: ids } })
    .toArray();

  const byPersona = new Map<string, GrowthOportunidad[]>();
  for (const o of oportunidades) {
    const list = byPersona.get(o.personaId) ?? [];
    list.push(o);
    byPersona.set(o.personaId, list);
  }

  return personas.map((p) =>
    presentPersonaListItem(toPersonaListItemView(p, byPersona.get(p._id) ?? []))
  );
}

export async function getGrowthPersonaDetailView(
  tenantId: string,
  personaId: string
): Promise<GrowthPersonaDetailView | null> {
  const db = await getDatabase();
  const personas = createMongoGrowthPersonaStore(db);
  const oportunidadesStore = createMongoGrowthOpportunityStore(db);

  const persona = await personas.findById(tenantId, personaId);
  if (!persona) return null;

  const [oportunidades, activities, conversations] = await Promise.all([
    oportunidadesStore.listByPersona(tenantId, personaId),
    db
      .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
      .find({ tenantId, personaId })
      .sort({ occurredAt: -1 })
      .limit(100)
      .toArray(),
    listPersonaConversationViews(tenantId, personaId),
  ]);

  return presentPersonaDetail(
    toPersonaDetailView(persona, oportunidades, activities, conversations)
  );
}

/**
 * Detalle de Oportunidad del Espacio activo.
 * Devuelve null si el id no existe en este tenant (p. ej. ID de otro Espacio).
 */
export async function getGrowthOportunidadDetailView(
  tenantId: string,
  oportunidadId: string
): Promise<GrowthOportunidadDetailView | null> {
  const db = await getDatabase();
  const personas = createMongoGrowthPersonaStore(db);
  const oportunidades = createMongoGrowthOpportunityStore(db);

  const oportunidad = await oportunidades.findById(tenantId, oportunidadId);
  if (!oportunidad) return null;

  const persona = await personas.findById(tenantId, oportunidad.personaId);
  if (!persona) return null;

  const activities = await db
    .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
    .find({ tenantId, oportunidadId })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();

  return presentOportunidadDetail(
    toOportunidadDetailView(oportunidad, persona, activities)
  );
}

/** Reexport util for tests: unclear filter excludes known human channels. */
export { isKnownHumanOriginChannel };
