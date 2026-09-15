/**
 * OT-GROWTH-ACTIVITY-001 — lectura tenant-scoped del historial comercial «Actividad».
 * SSOT: growth_actividades + proyección READ-ONLY de growth_mensajes / growth_conversaciones.
 * No alimenta el feed desde el Event Bus ni desde la auditoría Identity.
 * No escribe en growth_actividades.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthPersona,
} from "@/core/growth";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
  type GrowthConversation,
  type GrowthMessage,
} from "@/core/growth/messaging";
import { GROWTH_AUTOMATION_SYSTEM_ACTOR } from "@/core/growth/automations/types";
import { getDatabase } from "@/lib/mongodb";
import {
  captureOriginFromActivity,
  decodeActividadFeedCursor,
  dedupeHandoffTransitions,
  dueLabelFromActivityPayload,
  filterActividadFeedByCategory,
  growthActividadActorSystemLabel,
  growthActividadCaptureActorLabel,
  isGrowthAutomationActor,
  oportunidadFeedLabel,
  paginateActividadFeed,
  projectActivityToFeedItem,
  projectMessageToFeedItem,
  sortActividadFeedNewestFirst,
  type GrowthActividadFeedCategoryFilter,
  type GrowthActividadFeedCursor,
  type GrowthActividadFeedItem,
} from "./actividad-view";

export type {
  GrowthActividadFeedCategory,
  GrowthActividadFeedCategoryFilter,
  GrowthActividadFeedCursor,
  GrowthActividadFeedItem,
} from "./actividad-view";

export {
  GROWTH_ACTIVIDAD_FEED_CATEGORIES,
  GROWTH_ACTIVIDAD_PERSONAS_KINDS,
  GROWTH_ACTIVIDAD_VENTAS_KINDS,
  decodeActividadFeedCursor,
  encodeActividadFeedCursor,
  filterActividadFeedByCategory,
  isGrowthAutomationActor,
  projectActivityToFeedItem,
  projectMessageToFeedItem,
  resolveGrowthActividadCategory,
  sortActividadFeedNewestFirst,
} from "./actividad-view";

export interface GrowthActividadFeedFilters {
  category?: GrowthActividadFeedCategoryFilter;
  limit?: number;
  /** Cursor opaco (base64url) de la página anterior. */
  cursor?: string;
}

export interface GrowthActividadFeedResult {
  items: GrowthActividadFeedItem[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;
/** Over-fetch por fuente antes de merge/dedupe/filtro. */
const SOURCE_FETCH_FACTOR = 3;

function personaDisplayName(persona: GrowthPersona | undefined): string {
  const name = persona?.displayName?.trim();
  if (name) return name;
  const email = persona?.email?.trim();
  if (email) return email;
  const phone = persona?.phone?.trim();
  if (phone) return phone;
  return "Persona";
}

function mongoCursorFilter(
  cursor: GrowthActividadFeedCursor | null
): Filter<GrowthActivity | GrowthMessage> | undefined {
  if (!cursor) return undefined;
  // Aproximación por occurredAt; el desempate id se aplica en memoria tras el merge.
  return { occurredAt: { $lte: cursor.occurredAt } };
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

async function loadOportunidadesByIds(
  tenantId: string,
  oportunidadIds: string[]
): Promise<Map<string, GrowthOportunidad>> {
  if (oportunidadIds.length === 0) return new Map();
  const db = await getDatabase();
  const rows = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find({ tenantId, _id: { $in: oportunidadIds } })
    .toArray();
  return new Map(rows.map((o) => [o._id, o]));
}

async function loadActorLabelsByIds(
  tenantId: string,
  actorUserIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const realIds = [
    ...new Set(
      actorUserIds.filter(
        (id) => id && id !== GROWTH_AUTOMATION_SYSTEM_ACTOR
      )
    ),
  ];
  if (realIds.length === 0) return map;

  const db = await getDatabase();
  // Solo actores con membresía en este Espacio (sin resolver usuarios de otro tenant).
  const memberships = await db
    .collection<{ userId: string; tenantId: string; status?: string }>(
      "identity_memberships"
    )
    .find({
      tenantId,
      userId: { $in: realIds },
      status: "active",
    })
    .project({ userId: 1 })
    .toArray();
  const allowed = new Set(memberships.map((m) => m.userId));
  const scopedIds = realIds.filter((id) => allowed.has(id));
  if (scopedIds.length === 0) return map;

  const users = await db
    .collection<{ _id: string; displayName?: string; email?: string }>(
      "identity_users"
    )
    .find({ _id: { $in: scopedIds } })
    .project({ _id: 1, displayName: 1, email: 1 })
    .toArray();

  for (const user of users) {
    const label = user.displayName?.trim() || user.email?.trim();
    if (label) map.set(user._id, label);
  }
  return map;
}

function resolveActivityActorLabel(
  activity: GrowthActivity,
  actorLabels: Map<string, string>,
  captureOrigin: "form" | "application" | "other"
): string {
  if (isGrowthAutomationActor(activity.actorUserId)) {
    return growthActividadActorSystemLabel();
  }
  if (activity.actorUserId) {
    return actorLabels.get(activity.actorUserId) ?? "Equipo";
  }
  if (
    activity.kind === "form_submitted" ||
    activity.kind === "application_received" ||
    activity.kind === "opportunity_opened"
  ) {
    return growthActividadCaptureActorLabel(captureOrigin);
  }
  return "Equipo";
}

async function loadActivitiesForFeed(
  tenantId: string,
  fetchLimit: number,
  cursor: GrowthActividadFeedCursor | null,
  category: GrowthActividadFeedCategoryFilter
): Promise<GrowthActivity[]> {
  if (category === "mensajes") return [];

  const db = await getDatabase();
  const filter: Filter<GrowthActivity> = {
    tenantId,
    kind: { $ne: "identity_conflict" },
  };

  if (category === "personas") {
    filter.kind = {
      $in: ["form_submitted", "application_received", "opportunity_opened"],
    };
  } else if (category === "ventas") {
    filter.kind = {
      $in: [
        "opportunity_transitioned",
        "note",
        "contact",
        "next_action_set",
        "handoff",
      ],
    };
    filter.actorUserId = { $ne: GROWTH_AUTOMATION_SYSTEM_ACTOR };
  } else if (category === "automatizaciones") {
    filter.actorUserId = GROWTH_AUTOMATION_SYSTEM_ACTOR;
  }

  const cursorFilter = mongoCursorFilter(cursor);
  if (cursorFilter) {
    Object.assign(filter, cursorFilter);
  }

  return db
    .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
    .find(filter)
    .sort({ occurredAt: -1 })
    .limit(fetchLimit)
    .toArray();
}

async function loadMessagesForFeed(
  tenantId: string,
  fetchLimit: number,
  cursor: GrowthActividadFeedCursor | null,
  category: GrowthActividadFeedCategoryFilter
): Promise<
  Array<{
    message: GrowthMessage;
    conversation: GrowthConversation;
  }>
> {
  if (category === "personas" || category === "ventas" || category === "automatizaciones") {
    return [];
  }

  const db = await getDatabase();
  const filter: Filter<GrowthMessage> = { tenantId };
  const cursorFilter = mongoCursorFilter(cursor);
  if (cursorFilter) {
    Object.assign(filter, cursorFilter);
  }

  const messages = await db
    .collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION)
    .find(filter)
    .sort({ occurredAt: -1 })
    .limit(fetchLimit)
    .toArray();

  if (messages.length === 0) return [];

  const conversationIds = [...new Set(messages.map((m) => m.conversationId))];
  const conversations = await db
    .collection<GrowthConversation>(GROWTH_CONVERSACIONES_COLLECTION)
    .find({ tenantId, _id: { $in: conversationIds } })
    .toArray();
  const byId = new Map(conversations.map((c) => [c._id, c]));

  const rows: Array<{ message: GrowthMessage; conversation: GrowthConversation }> =
    [];
  for (const message of messages) {
    const conversation = byId.get(message.conversationId);
    if (!conversation) continue;
    rows.push({ message, conversation });
  }
  return rows;
}

/**
 * Historial comercial unificado del Espacio activo.
 * Toda query parte por `tenantId`. Joins solo dentro del mismo Espacio.
 */
export async function listGrowthActividadFeed(
  tenantId: string,
  filters: GrowthActividadFeedFilters = {}
): Promise<GrowthActividadFeedResult> {
  const tid = tenantId.trim();
  if (!tid) return { items: [], nextCursor: null };

  const category: GrowthActividadFeedCategoryFilter = filters.category ?? "all";
  const limit = Math.min(
    Math.max(filters.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const cursor = decodeActividadFeedCursor(filters.cursor);
  const fetchLimit = Math.min(limit * SOURCE_FETCH_FACTOR, MAX_LIMIT * 2);

  const [activitiesRaw, messageRows] = await Promise.all([
    loadActivitiesForFeed(tid, fetchLimit, cursor, category),
    loadMessagesForFeed(tid, fetchLimit, cursor, category),
  ]);

  const activities = dedupeHandoffTransitions(activitiesRaw);

  const personaIds = [
    ...new Set([
      ...activities.map((a) => a.personaId),
      ...messageRows.map((r) => r.conversation.personaId),
    ]),
  ];
  const oportunidadIds = [
    ...new Set(
      [
        ...activities.map((a) => a.oportunidadId),
        ...messageRows.map((r) => r.conversation.oportunidadId),
      ].filter((id): id is string => Boolean(id))
    ),
  ];
  const actorUserIds = activities
    .map((a) => a.actorUserId)
    .filter((id): id is string => Boolean(id));

  const [personas, oportunidades, actorLabels] = await Promise.all([
    loadPersonasByIds(tid, personaIds),
    loadOportunidadesByIds(tid, oportunidadIds),
    loadActorLabelsByIds(tid, actorUserIds),
  ]);

  const now = new Date();
  const items: GrowthActividadFeedItem[] = [];

  for (const activity of activities) {
    const captureOrigin = captureOriginFromActivity(activity);
    const persona = personas.get(activity.personaId);
    const oportunidad = activity.oportunidadId
      ? oportunidades.get(activity.oportunidadId)
      : undefined;
    const projected = projectActivityToFeedItem({
      activity,
      personaLabel: personaDisplayName(persona),
      ...(oportunidad
        ? {
            oportunidadLabel: oportunidadFeedLabel({
              typeKey: oportunidad.typeKey,
              status: oportunidad.status,
              subjectLabel: oportunidad.subjectLabel,
            }),
          }
        : {}),
      actorLabel: resolveActivityActorLabel(
        activity,
        actorLabels,
        captureOrigin
      ),
      captureOrigin,
      dueLabel: dueLabelFromActivityPayload(activity.payload, now),
    });
    if (projected) items.push(projected);
  }

  for (const { message, conversation } of messageRows) {
    const persona = personas.get(conversation.personaId);
    const personaLabel = personaDisplayName(persona);
    const oportunidad = conversation.oportunidadId
      ? oportunidades.get(conversation.oportunidadId)
      : undefined;

    items.push(
      projectMessageToFeedItem({
        message,
        personaId: conversation.personaId,
        personaLabel,
        ...(conversation.oportunidadId
          ? { oportunidadId: conversation.oportunidadId }
          : {}),
        ...(oportunidad
          ? {
              oportunidadLabel: oportunidadFeedLabel({
                typeKey: oportunidad.typeKey,
                status: oportunidad.status,
                subjectLabel: oportunidad.subjectLabel,
              }),
            }
          : {}),
        actorLabel:
          message.direction === "inbound" ? personaLabel : "Equipo",
        channel: conversation.channel,
      })
    );
  }

  const filtered = filterActividadFeedByCategory(
    sortActividadFeedNewestFirst(items),
    category
  );

  return paginateActividadFeed(filtered, limit, cursor);
}
