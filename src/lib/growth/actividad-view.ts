/**
 * OT-GROWTH-ACTIVITY-001 — proyección pura del feed comercial «Actividad».
 * Sin I/O. Contrato humano común para growth_actividades + proyección de mensajes.
 */

import { GROWTH_AUTOMATION_SYSTEM_ACTOR } from "@/core/growth/automations/types";
import type { GrowthActivity, GrowthActivityKind } from "@/core/growth/types";
import type {
  GrowthConversationChannel,
  GrowthMessage,
  GrowthMessageDirection,
} from "@/core/growth/messaging";
import { humanizeHomeActivityStory } from "@/components/admin/preview/growth-os-master/humanize-home-activity";
import {
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
} from "./labels";
import { growthConversationChannelLabel } from "./mensajes-view";

export const GROWTH_ACTIVIDAD_FEED_CATEGORIES = [
  "all",
  "personas",
  "ventas",
  "mensajes",
  "automatizaciones",
] as const;

export type GrowthActividadFeedCategoryFilter =
  (typeof GROWTH_ACTIVIDAD_FEED_CATEGORIES)[number];

export type GrowthActividadFeedCategory =
  | "personas"
  | "ventas"
  | "mensajes"
  | "automatizaciones";

export const GROWTH_ACTIVIDAD_PERSONAS_KINDS = [
  "form_submitted",
  "application_received",
  "opportunity_opened",
] as const satisfies readonly GrowthActivityKind[];

export const GROWTH_ACTIVIDAD_VENTAS_KINDS = [
  "opportunity_transitioned",
  "note",
  "contact",
  "next_action_set",
  "handoff",
] as const satisfies readonly GrowthActivityKind[];

const PERSONAS_KIND_SET = new Set<string>(GROWTH_ACTIVIDAD_PERSONAS_KINDS);
const VENTAS_KIND_SET = new Set<string>(GROWTH_ACTIVIDAD_VENTAS_KINDS);

/** Item de presentación del historial comercial del Espacio. */
export interface GrowthActividadFeedItem {
  id: string;
  category: GrowthActividadFeedCategory;
  story: string;
  personaId: string;
  personaLabel: string;
  oportunidadId?: string;
  oportunidadLabel?: string;
  actorLabel: string;
  occurredAt: string;
  channel?: string;
}

export interface GrowthActividadFeedCursor {
  occurredAt: string;
  id: string;
}

export interface ActivityFeedSourceRow {
  activity: GrowthActivity;
  personaLabel: string;
  oportunidadLabel?: string;
  actorLabel: string;
  captureOrigin?: "form" | "application" | "other";
  dueLabel?: string;
}

export interface MessageFeedSourceRow {
  message: Pick<
    GrowthMessage,
    "_id" | "direction" | "channel" | "occurredAt" | "body"
  >;
  personaId: string;
  personaLabel: string;
  oportunidadId?: string;
  oportunidadLabel?: string;
  actorLabel: string;
  channel: GrowthConversationChannel | string;
}

export function isGrowthAutomationActor(actorUserId: string | undefined): boolean {
  return actorUserId === GROWTH_AUTOMATION_SYSTEM_ACTOR;
}

export function growthActividadActorSystemLabel(): string {
  return "Growth OS";
}

export function growthActividadCaptureActorLabel(
  origin: "form" | "application" | "other" = "form"
): string {
  if (origin === "application") return "Admisión";
  if (origin === "form") return "Formulario web";
  return "Captación";
}

export function resolveGrowthActividadCategory(
  kind: string,
  actorUserId: string | undefined
): GrowthActividadFeedCategory | null {
  if (kind === "identity_conflict" || kind === "identity_updated") {
    return null;
  }
  if (isGrowthAutomationActor(actorUserId)) {
    return "automatizaciones";
  }
  if (PERSONAS_KIND_SET.has(kind)) return "personas";
  if (VENTAS_KIND_SET.has(kind)) return "ventas";
  if (kind === "message") return "mensajes";
  return null;
}

export function actividadFeedItemId(
  source: "activity" | "message",
  rawId: string
): string {
  return `${source}:${rawId}`;
}

export function parseActividadFeedItemId(
  id: string
): { source: "activity" | "message"; rawId: string } | null {
  const idx = id.indexOf(":");
  if (idx <= 0) return null;
  const source = id.slice(0, idx);
  const rawId = id.slice(idx + 1);
  if ((source !== "activity" && source !== "message") || !rawId) return null;
  return { source, rawId };
}

function formatDueLabel(dueAt: string | undefined, now: Date = new Date()): string | undefined {
  if (!dueAt) return undefined;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return undefined;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startDue.getTime() - startToday.getTime()) / dayMs);
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays === -1) return "ayer";
  return due.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function dueLabelFromActivityPayload(
  payload: Record<string, unknown> | undefined,
  now: Date = new Date()
): string | undefined {
  const dueAt =
    typeof payload?.dueAt === "string"
      ? payload.dueAt
      : typeof payload?.nextAction === "object" &&
          payload.nextAction &&
          typeof (payload.nextAction as { dueAt?: unknown }).dueAt === "string"
        ? (payload.nextAction as { dueAt: string }).dueAt
        : undefined;
  return formatDueLabel(dueAt, now);
}

export function captureOriginFromActivity(
  activity: Pick<GrowthActivity, "kind" | "payload" | "sourceCollection">
): "form" | "application" | "other" {
  if (activity.kind === "application_received") return "application";
  if (activity.kind === "form_submitted") return "form";
  const originKind =
    typeof activity.payload?.originKind === "string"
      ? activity.payload.originKind
      : typeof activity.payload?.kind === "string"
        ? activity.payload.kind
        : undefined;
  if (originKind === "admission") return "application";
  if (originKind === "form") return "form";
  if (activity.sourceCollection?.includes("form")) return "form";
  if (activity.sourceCollection?.includes("admission")) return "application";
  if (activity.kind === "opportunity_opened") return "form";
  return "other";
}

export function oportunidadFeedLabel(input: {
  typeKey?: string;
  status?: string;
  subjectLabel?: string;
}): string | undefined {
  const typeLabel = input.typeKey
    ? growthOpportunityTypeLabel(input.typeKey)
    : undefined;
  const statusLabel = input.status
    ? growthOpportunityStatusLabel(input.status)
    : undefined;
  if (typeLabel && statusLabel) return `${typeLabel} · ${statusLabel}`;
  if (typeLabel) return typeLabel;
  if (input.subjectLabel?.trim()) return input.subjectLabel.trim();
  return statusLabel;
}

/**
 * Si hay handoff + transition al mismo hecho (mismo sourceId u oportunidad+instante),
 * conserva solo handoff para no duplicar la historia.
 */
export function dedupeHandoffTransitions(
  activities: GrowthActivity[]
): GrowthActivity[] {
  const handoffKeys = new Set<string>();
  for (const row of activities) {
    if (row.kind !== "handoff") continue;
    if (row.sourceId) handoffKeys.add(`source:${row.sourceId}`);
    if (row.oportunidadId) {
      handoffKeys.add(`opp:${row.oportunidadId}:${row.occurredAt}`);
    }
  }
  if (handoffKeys.size === 0) return activities;

  return activities.filter((row) => {
    if (row.kind !== "opportunity_transitioned") return true;
    const toState =
      typeof row.payload?.toState === "string" ? row.payload.toState : "";
    const handedOff =
      toState === "handed_off" || /→\s*handed_off\b/i.test(row.summary);
    if (!handedOff) return true;
    if (row.sourceId && handoffKeys.has(`source:${row.sourceId}`)) return false;
    if (
      row.oportunidadId &&
      handoffKeys.has(`opp:${row.oportunidadId}:${row.occurredAt}`)
    ) {
      return false;
    }
    return true;
  });
}

export function projectActivityToFeedItem(
  props: ActivityFeedSourceRow
): GrowthActividadFeedItem | null {
  const { activity } = props;
  if (activity.kind === "identity_conflict") return null;

  const category = resolveGrowthActividadCategory(
    activity.kind,
    activity.actorUserId
  );
  if (!category) return null;

  const { story } = humanizeHomeActivityStory({
    kind: activity.kind,
    summary: activity.summary,
    personaName: props.personaLabel,
    actorLabel: props.actorLabel,
    dueLabel: props.dueLabel,
    captureOrigin: props.captureOrigin,
    variant: "feed",
  });

  return {
    id: actividadFeedItemId("activity", activity._id),
    category,
    story,
    personaId: activity.personaId,
    personaLabel: props.personaLabel,
    ...(activity.oportunidadId
      ? { oportunidadId: activity.oportunidadId }
      : {}),
    ...(props.oportunidadLabel
      ? { oportunidadLabel: props.oportunidadLabel }
      : {}),
    actorLabel: props.actorLabel,
    occurredAt: activity.occurredAt,
  };
}

export function projectMessageToFeedItem(
  props: MessageFeedSourceRow
): GrowthActividadFeedItem {
  const channelLabel = growthConversationChannelLabel(props.channel);
  const { story } = humanizeHomeActivityStory({
    kind: "message",
    summary: props.message.body,
    personaName: props.personaLabel,
    actorLabel: props.actorLabel,
    channelLabel,
    messageDirection: props.message.direction as GrowthMessageDirection,
    variant: "feed",
  });

  return {
    id: actividadFeedItemId("message", props.message._id),
    category: "mensajes",
    story,
    personaId: props.personaId,
    personaLabel: props.personaLabel,
    ...(props.oportunidadId ? { oportunidadId: props.oportunidadId } : {}),
    ...(props.oportunidadLabel
      ? { oportunidadLabel: props.oportunidadLabel }
      : {}),
    actorLabel: props.actorLabel,
    occurredAt: props.message.occurredAt,
    channel: channelLabel,
  };
}

export function sortActividadFeedNewestFirst(
  items: GrowthActividadFeedItem[]
): GrowthActividadFeedItem[] {
  return [...items].sort((a, b) => {
    const byTime = b.occurredAt.localeCompare(a.occurredAt);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });
}

export function filterActividadFeedByCategory(
  items: GrowthActividadFeedItem[],
  category: GrowthActividadFeedCategoryFilter
): GrowthActividadFeedItem[] {
  if (category === "all") return items;
  return items.filter((item) => item.category === category);
}

/** Cursor estable: occurredAt desc, id desc. */
export function isBeforeActividadCursor(
  item: Pick<GrowthActividadFeedItem, "occurredAt" | "id">,
  cursor: GrowthActividadFeedCursor
): boolean {
  if (item.occurredAt < cursor.occurredAt) return true;
  if (item.occurredAt > cursor.occurredAt) return false;
  return item.id < cursor.id;
}

export function encodeActividadFeedCursor(
  cursor: GrowthActividadFeedCursor
): string {
  return Buffer.from(
    JSON.stringify({ occurredAt: cursor.occurredAt, id: cursor.id }),
    "utf8"
  ).toString("base64url");
}

export function decodeActividadFeedCursor(
  raw: string | undefined | null
): GrowthActividadFeedCursor | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw.trim(), "base64url").toString("utf8")
    ) as { occurredAt?: unknown; id?: unknown };
    if (
      typeof parsed.occurredAt !== "string" ||
      typeof parsed.id !== "string" ||
      !parsed.occurredAt ||
      !parsed.id
    ) {
      return null;
    }
    return { occurredAt: parsed.occurredAt, id: parsed.id };
  } catch {
    return null;
  }
}

export function paginateActividadFeed(
  items: GrowthActividadFeedItem[],
  limit: number,
  cursor?: GrowthActividadFeedCursor | null
): {
  items: GrowthActividadFeedItem[];
  nextCursor: string | null;
} {
  const sorted = sortActividadFeedNewestFirst(items);
  const afterCursor = cursor
    ? sorted.filter((item) => isBeforeActividadCursor(item, cursor))
    : sorted;
  const page = afterCursor.slice(0, Math.max(1, limit));
  const last = page[page.length - 1];
  const hasMore = afterCursor.length > page.length;
  return {
    items: page,
    nextCursor:
      hasMore && last
        ? encodeActividadFeedCursor({
            occurredAt: last.occurredAt,
            id: last.id,
          })
        : null,
  };
}
