/**
 * OT-GROWTH-UX-HOME-004 — lectura de presentación para Inicio.
 * Reutiliza Conversion Engine, Panel comercial y Actividad; no crea API ni almacén analítico.
 */

import "server-only";

import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  type GrowthActivity,
} from "@/core/growth";
import { GROWTH_CAMPAIGNS_COLLECTION } from "@/core/growth/campaigns";
import { GROWTH_AUTOMATIONS_COLLECTION } from "@/core/growth/automations";
import {
  GROWTH_FUNNELS_COLLECTION,
  growthFunnelResultLabel,
  isGrowthFunnelResultKey,
} from "@/core/growth/funnel-types";
import { isTimestampInPeriod } from "@/lib/growth/analytics-period";
import type { ResolveAnalyticsPeriodInput } from "@/lib/growth/analytics-period";
import { readCommercialPanel } from "@/lib/growth/commercial-read";
import { getConversionAnalytics } from "@/lib/growth/conversion-analytics-read";
import { GROWTH_ANALITICA_PERIOD_LABELS } from "@/lib/growth/labels";
import {
  activitiesVisibleInUi,
  listGrowthPersonaViews,
  toActivityView,
} from "@/lib/growth/personas-read";
import { getDatabase } from "@/lib/mongodb";
import { compressHomeActivityFeed } from "./home-activity-feed";
import {
  homeActivityEventLabel,
  humanizeHomeActivityStory,
} from "./humanize-home-activity";
import {
  previousEqualWindow,
  projectHomeMetricTrends,
} from "./home-metric-trends";
import {
  emptyGrowthOsHomeView,
  pickPrimaryFunnel,
  projectGrowthOsHomeDashboard,
  type GrowthOsHomeCapabilities,
  type GrowthOsHomeFunnelStageOrder,
  type GrowthOsHomeView,
} from "./project-home";

/** Hechos crudos antes de comprimir; el Inicio muestra hasta ACTIVITY_FEED_LIMIT. */
const ACTIVITY_RAW_LIMIT = 24;
/** Últimos hechos relevantes en Inicio (historial completo sigue en Actividad). */
const ACTIVITY_FEED_LIMIT = 5;

/** Hechos con sentido en la historia del Inicio (presentación; no altera Mongo). */
const HOME_ACTIVITY_KINDS = new Set([
  "form_submitted",
  "application_received",
  "opportunity_opened",
  "opportunity_transitioned",
  "opportunity_assigned",
  "next_action_set",
  "handoff",
  "contact",
  "note",
]);

export type LoadGrowthOsHomeSnapshotInput = {
  tenantId: string;
  userId: string;
  empty?: boolean;
  periodQuery?: ResolveAnalyticsPeriodInput;
  capabilities: GrowthOsHomeCapabilities;
};

function periodLabel(preset: string): string {
  const labels = GROWTH_ANALITICA_PERIOD_LABELS as Record<string, string>;
  return labels[preset] ?? "Período";
}

function activityHref(row: GrowthActivity): string | undefined {
  if (row.oportunidadId?.trim()) {
    return `/admin/ventas/${encodeURIComponent(row.oportunidadId.trim())}`;
  }
  if (row.personaId?.trim()) {
    return `/admin/personas/${encodeURIComponent(row.personaId.trim())}`;
  }
  return undefined;
}

export async function loadGrowthOsHomeSnapshot(
  tenantIdOrInput: string | LoadGrowthOsHomeSnapshotInput,
  emptyLegacy?: boolean
): Promise<GrowthOsHomeView> {
  const input: LoadGrowthOsHomeSnapshotInput =
    typeof tenantIdOrInput === "string"
      ? {
          tenantId: tenantIdOrInput,
          userId: "",
          empty: emptyLegacy,
          capabilities: {
            salesView: true,
            salesOperate: true,
            salesRead: true,
            campaignsView: true,
            analyticsView: true,
            peopleView: true,
            activityView: true,
          },
        }
      : tenantIdOrInput;

  const { tenantId, capabilities } = input;
  if (input.empty) return emptyGrowthOsHomeView(capabilities);

  const periodQuery = input.periodQuery ?? { preset: "last_30d" };
  const spaceWide =
    capabilities.salesView || capabilities.salesRead;

  const db = await getDatabase();

  const [analyticsResult, commercial, personas, campaignCount, automationCount, funnelDocs] =
    await Promise.all([
      capabilities.salesView || capabilities.salesRead || capabilities.salesOperate
        ? getConversionAnalytics(tenantId, periodQuery)
        : Promise.resolve(null),
      input.userId
        ? readCommercialPanel(tenantId, input.userId, spaceWide)
        : Promise.resolve({
            scope: "mine" as const,
            overdue: 0,
            unfollowed: 0,
            stale: 0,
            unassigned: 0,
            rows: [],
          }),
      capabilities.peopleView
        ? listGrowthPersonaViews(tenantId)
        : Promise.resolve([]),
      capabilities.campaignsView
        ? db.collection(GROWTH_CAMPAIGNS_COLLECTION).countDocuments({ tenantId })
        : Promise.resolve(0),
      db.collection(GROWTH_AUTOMATIONS_COLLECTION).countDocuments({ tenantId }),
      db
        .collection<{
          tenantId: string;
          key: string;
          name?: string;
          workflowDefinitionKey?: string;
        }>(GROWTH_FUNNELS_COLLECTION)
        .find({ tenantId })
        .toArray(),
    ]);

  const analytics =
    analyticsResult && analyticsResult.ok ? analyticsResult.data : null;
  const period = analytics?.period;

  // Orden de etapas del mismo embudo que la proyección presenta (por stock), no
  // del "default" a ciegas: con varios embudos eso mezclaba claves ajenas.
  let funnelStageOrder: GrowthOsHomeFunnelStageOrder | undefined;
  const primaryStock = analytics ? pickPrimaryFunnel(analytics) : null;
  const primaryFunnelDoc = primaryStock
    ? funnelDocs.find((f) => f.key === primaryStock.funnelKey)
    : undefined;
  if (primaryFunnelDoc?.workflowDefinitionKey) {
    const definition = await db
      .collection<{
        tenantId: string;
        key: string;
        states?: Array<{ key: string; label: string }>;
      }>("workflow_definitions")
      .findOne({
        tenantId,
        key: primaryFunnelDoc.workflowDefinitionKey,
      });
    const stages = (definition?.states ?? [])
      .filter((state) => !isGrowthFunnelResultKey(state.key))
      .map((state) => ({
        key: state.key,
        label: growthFunnelResultLabel(state.key) ?? state.label,
      }));
    if (stages.length > 0) {
      funnelStageOrder = {
        funnelKey: primaryFunnelDoc.key,
        stages,
      };
    }
  }

  const activityFilter = { tenantId, kind: { $ne: "identity_conflict" as const } };
  const activityRows = await db
    .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
    .find(activityFilter)
    .sort({ occurredAt: -1 })
    .limit(80)
    .toArray();

  const inPeriod = (iso: string | undefined) =>
    period
      ? isTimestampInPeriod(iso, period.start, period.end)
      : Boolean(iso);

  const activityCount = period
    ? await db.collection(GROWTH_ACTIVIDADES_COLLECTION).countDocuments({
        tenantId,
        kind: { $ne: "identity_conflict" },
        occurredAt: { $gte: period.start, $lt: period.end },
      })
    : await db.collection(GROWTH_ACTIVIDADES_COLLECTION).countDocuments({
        tenantId,
        kind: { $ne: "identity_conflict" },
      });

  const nameById = new Map(personas.map((item) => [item.id, item.displayName]));
  const rawActivities = activitiesVisibleInUi(activityRows)
    .filter((row) => HOME_ACTIVITY_KINDS.has(row.kind))
    .filter((row) => (period ? inPeriod(row.occurredAt) : true))
    .slice(0, ACTIVITY_RAW_LIMIT)
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
        href: activityHref(row),
        eventLabel: homeActivityEventLabel(tone),
        kind: row.kind,
        personaId: row.personaId?.trim() || undefined,
        oportunidadId: row.oportunidadId?.trim() || undefined,
      };
    });
  const activities = compressHomeActivityFeed(rawActivities, ACTIVITY_FEED_LIMIT);

  const view = projectGrowthOsHomeDashboard({
    analytics,
    commercialRows: commercial.rows,
    commercialCounts: {
      overdue: commercial.overdue,
      unfollowed: commercial.unfollowed,
      stale: commercial.stale,
      unassigned: commercial.unassigned,
    },
    activityCountInPeriod: activityCount,
    activities,
    periodLabel: periodLabel(period?.preset ?? "last_30d"),
    capabilities,
    hasCampaigns: campaignCount > 0,
    hasAutomations: automationCount > 0,
    personasCount: personas.length,
    funnelStageOrder,
  });

  if (!period) return view;

  const prev = previousEqualWindow(period.start, period.end);
  const [opportunityRows, activityTimeRows] = await Promise.all([
    db
      .collection<{
        openedAt?: string;
        closedAt?: string | null;
        status?: string;
      }>(GROWTH_OPORTUNIDADES_COLLECTION)
      .find(
        {
          tenantId,
          $or: [
            { closedAt: { $exists: false } },
            { closedAt: null },
            { closedAt: { $gte: prev.start } },
            { openedAt: { $gte: prev.start, $lt: period.end } },
          ],
        },
        { projection: { openedAt: 1, closedAt: 1, status: 1 } }
      )
      .toArray(),
    db
      .collection<{ occurredAt?: string }>(GROWTH_ACTIVIDADES_COLLECTION)
      .find(
        {
          tenantId,
          kind: { $ne: "identity_conflict" },
          occurredAt: { $gte: prev.start, $lt: period.end },
        },
        { projection: { occurredAt: 1 } }
      )
      .toArray(),
  ]);

  view.trends = projectHomeMetricTrends({
    periodStart: period.start,
    periodEnd: period.end,
    openedAt: opportunityRows.map((row) => row.openedAt),
    closedWonAt: opportunityRows
      .filter((row) => row.status === "won")
      .map((row) => row.closedAt),
    activityAt: activityTimeRows.map((row) => row.occurredAt),
    openRows: opportunityRows,
    current: {
      nuevosProspectos: view.metrics.nuevosProspectos,
      oportunidadesActivas: view.metrics.oportunidadesActivas,
      ganadas: view.metrics.ganadas,
      porAtender: view.metrics.porAtender,
      actividad: view.metrics.actividad,
    },
  });

  return view;
}
