/**
 * Compresión de hechos del Inicio: agrupa rachas relacionadas sin inventar eventos.
 * Solo presentación; no altera Mongo ni el historial completo de Actividad.
 */

import {
  homeActivityEventLabel,
  type HomeActivityTone,
} from "./humanize-home-activity";
import type { GrowthOsHomeActivityItem } from "./project-home";

export type HomeActivityFeedRaw = GrowthOsHomeActivityItem & {
  kind: string;
  personaId?: string;
  oportunidadId?: string;
};

const GROUP_WINDOW_MS = 15 * 60 * 1000;

function withinWindow(a: string, b: string): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return false;
  return Math.abs(ta - tb) <= GROUP_WINDOW_MS;
}

function withEventLabel(item: GrowthOsHomeActivityItem): GrowthOsHomeActivityItem {
  if (item.eventLabel) return item;
  return { ...item, eventLabel: homeActivityEventLabel(item.tone) };
}

function mergeFormAndOpen(
  newer: HomeActivityFeedRaw,
  older: HomeActivityFeedRaw
): GrowthOsHomeActivityItem | null {
  const kinds = new Set([newer.kind, older.kind]);
  if (!kinds.has("form_submitted") && !kinds.has("application_received")) return null;
  if (!kinds.has("opportunity_opened")) return null;
  const samePersona =
    Boolean(newer.personaId) && newer.personaId === older.personaId;
  const sameOpp =
    Boolean(newer.oportunidadId) && newer.oportunidadId === older.oportunidadId;
  if (!samePersona && !sameOpp) return null;
  if (!withinWindow(newer.occurredAt, older.occurredAt)) return null;

  const name = newer.personaName ?? older.personaName;
  const fromApp = kinds.has("application_received");
  const tone: HomeActivityTone =
    newer.tone === "diagnosis" || older.tone === "diagnosis" ? "diagnosis" : "form";
  const story = name
    ? fromApp
      ? `${name} envió una postulación y se abrió una oportunidad.`
      : tone === "diagnosis"
        ? `${name} completó un diagnóstico y se abrió una oportunidad.`
        : `${name} envió un formulario y se abrió una oportunidad.`
    : fromApp
      ? "Se recibió una postulación y se abrió una oportunidad."
      : tone === "diagnosis"
        ? "Se completó un diagnóstico y se abrió una oportunidad."
        : "Se envió un formulario y se abrió una oportunidad.";

  return withEventLabel({
    id: newer.id,
    story,
    tone,
    occurredAt: newer.occurredAt,
    personaName: name,
    href: newer.href ?? older.href,
    eventLabel: homeActivityEventLabel(tone),
    kindLabel: newer.kindLabel ?? older.kindLabel,
  });
}

function mergeStageAndFollowup(
  newer: HomeActivityFeedRaw,
  older: HomeActivityFeedRaw
): GrowthOsHomeActivityItem | null {
  const kinds = new Set([newer.kind, older.kind]);
  if (!kinds.has("opportunity_transitioned") || !kinds.has("next_action_set")) {
    return null;
  }
  const sameOpp =
    Boolean(newer.oportunidadId) && newer.oportunidadId === older.oportunidadId;
  if (!sameOpp || !withinWindow(newer.occurredAt, older.occurredAt)) return null;

  const stage = newer.kind === "opportunity_transitioned" ? newer : older;
  const follow = newer.kind === "next_action_set" ? newer : older;
  const tone: HomeActivityTone = stage.tone === "close" ? "close" : "stage";
  const base = stage.story.replace(/\.$/, "");
  return withEventLabel({
    id: newer.id,
    story: `${base} y se programó un seguimiento.`,
    tone,
    occurredAt: newer.occurredAt,
    personaName: newer.personaName ?? older.personaName,
    href: newer.href ?? older.href ?? follow.href,
    eventLabel: homeActivityEventLabel(tone),
  });
}

/**
 * Recibe hechos ya ordenados (más reciente primero) y comprime pares relacionados.
 */
export function compressHomeActivityFeed(
  items: HomeActivityFeedRaw[],
  limit = 5
): GrowthOsHomeActivityItem[] {
  const out: GrowthOsHomeActivityItem[] = [];
  let i = 0;
  while (i < items.length && out.length < limit) {
    const current = items[i]!;
    const next = items[i + 1];
    if (next) {
      const merged =
        mergeFormAndOpen(current, next) ?? mergeStageAndFollowup(current, next);
      if (merged) {
        out.push(merged);
        i += 2;
        continue;
      }
    }
    out.push(
      withEventLabel({
        id: current.id,
        story: current.story,
        tone: current.tone,
        occurredAt: current.occurredAt,
        summary: current.summary,
        kindLabel: current.kindLabel,
        personaName: current.personaName,
        href: current.href,
        eventLabel: current.eventLabel,
      })
    );
    i += 1;
  }
  return out;
}
