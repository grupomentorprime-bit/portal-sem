/**
 * OT-GROWTH-UX-ADMIN-MASTER-001 / 001A / UX-HOME-003 — proyección pura Inicio (sin I/O).
 * Solo conteos y hechos que Growth Core ya puede sostener.
 */

import { GROWTH_NO_NEXT_ACTION_LABEL } from "@/lib/growth/labels";
import type { GrowthPersonaListItemView } from "@/lib/growth/persona-view";
import {
  humanizeHomeSituation,
  type HomeActivityTone,
} from "./humanize-home-activity";
import { humanizeOriginDisplayLabel } from "./humanize-origin-display";

export interface GrowthOsHomeActivityItem {
  id: string;
  /** Frase cotidiana para «Qué ha pasado». */
  story: string;
  tone: HomeActivityTone;
  occurredAt: string;
  /** @deprecated Preferir `story`; se conserva para compat de pruebas antiguas. */
  summary?: string;
  /** @deprecated Preferir `story`. */
  kindLabel?: string;
  personaName?: string;
}

export interface GrowthOsHomeAttentionItem {
  id: string;
  displayName: string;
  originLabel: string;
  /** Chip de tipo de oportunidad cuando existe (p. ej. Consulta). */
  typeLabel?: string;
  /** Qué ocurrió / situación, sin repetir la próxima acción. */
  situationLabel?: string;
  opportunitySummary?: string;
  nextActionLabel: string;
  updatedAt: string;
}

export interface GrowthOsHomeOpportunityItem {
  id: string;
  displayName: string;
  opportunitySummary: string;
  originLabel: string;
  nextActionLabel: string;
}

export interface GrowthOsHomeOriginItem {
  label: string;
  count: number;
}

export interface GrowthOsHomeMetrics {
  personas: number;
  oportunidades: number;
  porAtender: number;
  actividad: number;
}

export interface GrowthOsHomeView {
  metrics: GrowthOsHomeMetrics;
  attention: GrowthOsHomeAttentionItem[];
  /** Conservado en proyección; el Inicio 003 no lo muestra si duplica «Qué hacer ahora». */
  opportunities: GrowthOsHomeOpportunityItem[];
  activity: GrowthOsHomeActivityItem[];
  origins: GrowthOsHomeOriginItem[];
}

const ATTENTION_LIMIT = 5;
const OPPORTUNITY_LIMIT = 5;
const ORIGIN_LIMIT = 6;

export function emptyGrowthOsHomeView(): GrowthOsHomeView {
  return {
    metrics: {
      personas: 0,
      oportunidades: 0,
      porAtender: 0,
      actividad: 0,
    },
    attention: [],
    opportunities: [],
    activity: [],
    origins: [],
  };
}

export function projectGrowthOsHome(input: {
  personas: GrowthPersonaListItemView[];
  activityCount: number;
  activities: GrowthOsHomeActivityItem[];
}): GrowthOsHomeView {
  const personas = input.personas;
  const needingAttention = personas.filter(
    (item) => item.nextActionLabel !== GROWTH_NO_NEXT_ACTION_LABEL
  );

  const originsMap = new Map<string, number>();
  for (const item of personas) {
    const label = humanizeOriginDisplayLabel(
      item.originLabel.trim() || "Sin origen claro"
    );
    originsMap.set(label, (originsMap.get(label) ?? 0) + 1);
  }

  const origins = [...originsMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
    .slice(0, ORIGIN_LIMIT);

  const opportunities = personas
    .filter((item) => Boolean(item.opportunitySummary))
    .map((item) => ({
      id: item.id,
      displayName: item.displayName,
      opportunitySummary: item.opportunitySummary as string,
      originLabel: humanizeOriginDisplayLabel(item.originLabel),
      nextActionLabel: item.nextActionLabel,
    }))
    .slice(0, OPPORTUNITY_LIMIT);

  return {
    metrics: {
      personas: personas.length,
      oportunidades: personas.reduce((sum, item) => sum + item.opportunityCount, 0),
      porAtender: needingAttention.length,
      actividad: input.activityCount,
    },
    attention: needingAttention.slice(0, ATTENTION_LIMIT).map((item) => {
      const situation = humanizeHomeSituation(item.opportunitySummary);
      return {
        id: item.id,
        displayName: item.displayName,
        originLabel: humanizeOriginDisplayLabel(item.originLabel),
        typeLabel: situation.typeLabel,
        situationLabel: situation.situationLabel,
        opportunitySummary: item.opportunitySummary,
        nextActionLabel: item.nextActionLabel,
        updatedAt: item.updatedAt,
      };
    }),
    opportunities,
    activity: input.activities,
    origins,
  };
}
