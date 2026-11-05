/**
 * Proyección comercial de una Persona, independiente del Espacio.
 * Solo cuenta y nombra datos que ya vienen en oportunidades o evaluaciones.
 */

import { isGrowthOpportunityFinalStatus } from "@/core/growth/opportunity-definition";
import { growthOpportunityTypeLabel } from "./labels";
import type { GrowthActivityView } from "./persona-view";

export const GROWTH_PERSONA_SECTION_IDS = [
  "resumen",
  "diagnosticos",
  "oportunidades",
  "actividad",
  "notas",
] as const;

export type GrowthPersonaSectionId = (typeof GROWTH_PERSONA_SECTION_IDS)[number];

export type GrowthPersonaAssessmentTone = "clear" | "doubt" | "gap" | "missing";

export interface GrowthPersonaAssessmentHighlight {
  id: string;
  label: string;
  statusLabel: string;
  detail?: string;
  /** Tono visual opcional. Lo define la extensión del Espacio, no el núcleo. */
  tone?: GrowthPersonaAssessmentTone;
}

export interface GrowthPersonaAssessmentView {
  id: string;
  title: string;
  capturedAt: string;
  headline: string;
  disclaimer?: string;
  reportPath?: string;
  oportunidadId?: string;
  highlights: GrowthPersonaAssessmentHighlight[];
  priorities: Array<{ id: string; label: string }>;
  organizationName?: string;
  /** Consentimiento de comunicaciones comerciales, si el registro lo trae. */
  commercialAuthorized?: boolean;
}

export interface GrowthPersonaSignalView {
  id: string;
  label: string;
  value: string;
  hint?: string;
  /** Fecha real para un hint relativo, sin texto inventado. */
  hintAt?: string;
}

export interface GrowthPersonaWorkspaceView {
  signals: GrowthPersonaSignalView[];
  assessments: GrowthPersonaAssessmentView[];
}

export interface GrowthPersonaOpenOpportunityHint {
  status: string;
  originLabel: string;
  openedAt: string;
}

export function personaInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "·";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function buildPersonaWorkspace(
  oportunidades: GrowthPersonaOpenOpportunityHint[],
  assessments: GrowthPersonaAssessmentView[]
): GrowthPersonaWorkspaceView {
  const sorted = [...assessments].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  const open = oportunidades
    .filter((oportunidad) => !isGrowthOpportunityFinalStatus(oportunidad.status))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const latest = sorted[0];
  const signals: GrowthPersonaSignalView[] = [];

  if (latest) {
    signals.push({
      id: "assessments",
      label: "Diagnósticos realizados",
      value: String(sorted.length),
      hintAt: latest.capturedAt,
    });
  }

  signals.push({
    id: "opportunities",
    label: "Oportunidades activas",
    value: String(open.length),
    hint: open[0]?.originLabel,
  });

  if (latest) {
    const gap = latest.priorities[0];
    const finding = gap
      ? latest.highlights.find((item) => item.id === gap.id)?.detail
      : undefined;
    signals.push({
      id: "gap",
      label: "Brecha principal",
      value: gap?.label ?? latest.headline,
      hint: finding,
    });
    if (typeof latest.commercialAuthorized === "boolean") {
      signals.push({
        id: "consent",
        label: "Consentimiento comercial",
        value: latest.commercialAuthorized ? "Autorizado" : "No autorizado",
        hint: "Comunicaciones comerciales",
      });
    }
  }

  return { signals, assessments: sorted };
}

export function resolvePersonaSection(
  raw: string | undefined,
  hasAssessments: boolean
): GrowthPersonaSectionId {
  const requested = raw?.trim();
  if (requested === "diagnosticos" && !hasAssessments) return "resumen";
  if (
    requested &&
    (GROWTH_PERSONA_SECTION_IDS as readonly string[]).includes(requested)
  ) {
    return requested as GrowthPersonaSectionId;
  }
  return "resumen";
}

export function visiblePersonaSections(hasAssessments: boolean): Array<{
  id: GrowthPersonaSectionId;
  label: string;
}> {
  const labels: Record<GrowthPersonaSectionId, string> = {
    resumen: "Resumen",
    diagnosticos: "Diagnósticos",
    oportunidades: "Oportunidades",
    actividad: "Actividad",
    notas: "Notas",
  };
  return GROWTH_PERSONA_SECTION_IDS.filter(
    (id) => id !== "diagnosticos" || hasAssessments
  ).map((id) => ({ id, label: labels[id] }));
}

/** Quita el mismo hecho repetido y, si se pide, los que ya muestra otra sección. */
export function visibleTimelineActivities(
  activities: GrowthActivityView[],
  options?: { omitSourceIds?: string[] }
): GrowthActivityView[] {
  const omit = new Set(options?.omitSourceIds ?? []);
  const seen = new Set<string>();
  const visible: GrowthActivityView[] = [];
  for (const activity of activities) {
    if (activity.sourceId && omit.has(activity.sourceId)) continue;
    const key = activity.sourceId
      ? `${activity.kind}:${activity.sourceCollection ?? ""}:${activity.sourceId}`
      : activity.id;
    if (seen.has(key)) continue;
    seen.add(key);
    visible.push(activity);
  }
  return visible;
}

/** Etiqueta comercial del Espacio. La clave técnica no se muestra. */
export function opportunityTypeDisplayLabel(
  typeKey: string,
  typeLabels?: Record<string, string>
): string {
  const configured = typeLabels?.[typeKey]?.trim();
  if (configured) return configured;
  const known = growthOpportunityTypeLabel(typeKey);
  if (known !== typeKey) return known;
  const words = typeKey.split(/[-_]/).filter(Boolean);
  if (words.length === 0) return "Oportunidad";
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Sustituye claves técnicas ya guardadas en el texto, sin reescribir el hecho. */
export function humanizeActivitySummary(
  summary: string,
  typeLabels?: Record<string, string>
): string {
  const labels = {
    inquiry: "Consulta",
    registration: "Registro",
    conversion: "Conversión",
    ...typeLabels,
  };
  let text = summary;
  for (const [key, label] of Object.entries(labels)) {
    const readable = label?.trim();
    if (!key || !readable || key === readable) continue;
    text = text.replaceAll(`(${key})`, `(${readable})`);
  }
  return text;
}

/** Notas escritas por una persona frente a notas generadas por un origen automático. */
export function partitionPersonaNotes(activities: GrowthActivityView[]): {
  human: GrowthActivityView[];
  automatic: GrowthActivityView[];
} {
  const human: GrowthActivityView[] = [];
  const automatic: GrowthActivityView[] = [];
  for (const activity of activities) {
    if (activity.kind !== "note") continue;
    if (activity.sourceCollection) automatic.push(activity);
    else human.push(activity);
  }
  return { human, automatic };
}

/** Conserva el orden recibido y agrupa rachas del mismo día. */
export function groupActivitiesByDate(
  activities: GrowthActivityView[],
  dayKey: (iso: string) => string = (iso) => iso.slice(0, 10)
): Array<{ key: string; items: GrowthActivityView[] }> {
  const groups: Array<{ key: string; items: GrowthActivityView[] }> = [];
  for (const activity of activities) {
    const key = dayKey(activity.occurredAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(activity);
    else groups.push({ key, items: [activity] });
  }
  return groups;
}

export function preferredOperableOpportunityId(
  oportunidades: Array<{ id: string; status: string }>,
  primaryOpportunityId?: string
): string | undefined {
  if (
    primaryOpportunityId &&
    oportunidades.some(
      (item) =>
        item.id === primaryOpportunityId &&
        !isGrowthOpportunityFinalStatus(item.status)
    )
  ) {
    return primaryOpportunityId;
  }
  return (
    oportunidades.find((item) => !isGrowthOpportunityFinalStatus(item.status))?.id ??
    oportunidades[0]?.id
  );
}

export type NextActionExecution =
  | { type: "report"; href: string }
  | { type: "messages"; href: string };

export function nextActionExecution(input: {
  kind: string;
  reportPath?: string;
  conversationId?: string;
}): NextActionExecution | null {
  if (input.kind === "review" && input.reportPath) {
    return { type: "report", href: input.reportPath };
  }
  if (input.kind === "contact" && input.conversationId) {
    return {
      type: "messages",
      href: `/admin/mensajes?c=${encodeURIComponent(input.conversationId)}`,
    };
  }
  return null;
}
