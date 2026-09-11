/**
 * OT-GROWTH-UX-ADMIN-MASTER-001 / UX-HOME-003 / 003A — lectura de presentación para Inicio.
 * Reutiliza listados Core existentes; no crea API ni cambia colecciones.
 */

import "server-only";

import {
  GROWTH_ACTIVIDADES_COLLECTION,
  type GrowthActivity,
} from "@/core/growth";
import {
  activitiesVisibleInUi,
  listGrowthPersonaViews,
  toActivityView,
} from "@/lib/growth/personas-read";
import { getDatabase } from "@/lib/mongodb";
import { humanizeHomeActivityStory } from "./humanize-home-activity";
import {
  emptyGrowthOsHomeView,
  projectGrowthOsHome,
  type GrowthOsHomeView,
} from "./project-home";

/** Últimos hechos relevantes en Inicio (historial completo sigue en Actividad). */
const ACTIVITY_FEED_LIMIT = 4;

/** Hechos con sentido en la historia del Inicio (presentación; no altera Mongo). */
const HOME_ACTIVITY_KINDS = new Set([
  "form_submitted",
  "application_received",
  "opportunity_opened",
  "opportunity_transitioned",
  "next_action_set",
  "handoff",
  "contact",
  "note",
]);

export async function loadGrowthOsHomeSnapshot(
  tenantId: string,
  empty: boolean
): Promise<GrowthOsHomeView> {
  if (empty) return emptyGrowthOsHomeView();

  const personas = await listGrowthPersonaViews(tenantId);
  const db = await getDatabase();
  const activityFilter = { tenantId, kind: { $ne: "identity_conflict" as const } };

  const [activityCount, activityRows] = await Promise.all([
    db.collection(GROWTH_ACTIVIDADES_COLLECTION).countDocuments(activityFilter),
    db
      .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
      .find(activityFilter)
      .sort({ occurredAt: -1 })
      .limit(24)
      .toArray(),
  ]);

  const nameById = new Map(personas.map((item) => [item.id, item.displayName]));
  const activities = activitiesVisibleInUi(activityRows)
    .filter((row) => HOME_ACTIVITY_KINDS.has(row.kind))
    .slice(0, ACTIVITY_FEED_LIMIT)
    .map((row) => {
      const view = toActivityView(row);
      const personaName = nameById.get(row.personaId);
      const { story, tone } = humanizeHomeActivityStory({
        kind: row.kind,
        summary: view.summary,
        personaName,
      });
      return {
        id: view.id,
        story,
        tone,
        occurredAt: view.occurredAt,
        summary: view.summary,
        kindLabel: view.kindLabel,
        personaName,
      };
    });

  return projectGrowthOsHome({
    personas,
    activityCount,
    activities,
  });
}
