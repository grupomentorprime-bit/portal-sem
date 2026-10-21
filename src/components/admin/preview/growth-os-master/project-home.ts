/**
 * OT-GROWTH-UX-HOME-004 — proyección pura del Inicio (sin I/O).
 * Solo conteos y hechos que Conversion Engine, Panel comercial y Actividad ya sostienen.
 * La comparación visual del encabezado vive en `home-metric-trends` (ventana anterior real).
 */

import {
  CONVERSION_DENOMINATORS,
  CONVERSION_RATE_NOTE,
  type ConversionAnalyticsResponse,
  type ConversionCountRow,
  type ConversionOwnerRow,
} from "@/lib/growth/conversion-analytics";
import type { CommercialQueueRow } from "@/lib/growth/commercial-read";
import { GROWTH_NO_NEXT_ACTION_LABEL } from "@/lib/growth/labels";
import type { GrowthPersonaListItemView } from "@/lib/growth/persona-view";
import {
  humanizeHomeSituation,
  type HomeActivityTone,
} from "./humanize-home-activity";
import type { HomeMetricTrends } from "./home-metric-trends";
import { humanizeOriginDisplayLabel } from "./humanize-origin-display";

export interface GrowthOsHomeActivityItem {
  id: string;
  /** Frase cotidiana para actividad reciente. */
  story: string;
  tone: HomeActivityTone;
  occurredAt: string;
  /** Etiqueta corta del tipo (contacto, etapa, asignación…). */
  eventLabel?: string;
  /** @deprecated Preferir `story`; se conserva para compat de pruebas antiguas. */
  summary?: string;
  /** @deprecated Preferir `story`. */
  kindLabel?: string;
  personaName?: string;
  href?: string;
}

export interface GrowthOsHomeAttentionItem {
  id: string;
  displayName: string;
  /** Etapa · embudo u origen legible. */
  contextLabel: string;
  originLabel: string;
  typeLabel?: string;
  situationLabel?: string;
  opportunitySummary?: string;
  nextActionLabel: string;
  updatedAt: string;
  /** Banda de prioridad comercial. */
  band: string | null;
  bandLabel: string;
  /** Motivo de atención (Sin seguimiento, Vencida, Estancada). */
  reasonLabel: string;
  ageLabel: string;
  href: string;
  ownerLabel?: string;
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
  share: number | null;
}

export interface GrowthOsHomeFunnelStage {
  key: string;
  label: string;
  count: number;
  /** Participación del stock abierto (no es tasa de cohorte). */
  shareOfStock: number | null;
}

export interface GrowthOsHomeFunnel {
  funnelKey: string;
  funnelLabel: string;
  stages: GrowthOsHomeFunnelStage[];
  stockTotal: number;
  /** Tasa de cohorte del período (won / cohorte), no del stock. */
  cohortRate: number | null;
  cohortSize: number;
  /** Ganadas de esa cohorte. Mismo numerador que `cohortRate`; no es el stock ni los cierres del período. */
  cohortWon: number;
  /** Cierres ganados del período (Espacio). Resultado aparte del stock por etapa. */
  periodWon: number;
  stockDenominator: string;
  cohortDenominator: string;
  cohortNote: string;
}

export interface GrowthOsHomeOwnerRow {
  userId: string | null;
  label: string;
  /** Oportunidades activas a cargo (stock abierto). */
  open: number;
  /** Ganadas del período atribuibles. */
  won: number;
}

/** Stock abierto sin responsable: pendiente de asignación, no es un ejecutivo. */
export interface GrowthOsHomeUnassignedOwner {
  open: number;
}

export interface GrowthOsHomeNextStep {
  id: string;
  label: string;
  detail?: string;
  href: string;
  /** Cantidad real que respalda la acción (si aplica). */
  count?: number;
}

export interface GrowthOsHomeMetrics {
  /** Altas con openedAt en el período (captación Conversion Engine). */
  nuevosProspectos: number;
  /** Oportunidades abiertas ahora (stock). */
  oportunidadesActivas: number;
  /** Cierres ganados del período. */
  ganadas: number;
  /** Vencidas + sin seguimiento + estancadas. */
  porAtender: number;
  /** Hechos del Espacio con occurredAt en el período. */
  actividad: number;
  /** Compat: personas del Espacio (proyección legacy / vacíos). */
  personas: number;
  /** Compat: alias de oportunidadesActivas en proyección legacy. */
  oportunidades: number;
}

export interface GrowthOsHomePeriodView {
  preset: string;
  start: string;
  end: string;
  label: string;
}

export interface GrowthOsHomeCapabilities {
  salesView: boolean;
  salesOperate: boolean;
  salesRead: boolean;
  campaignsView: boolean;
  analyticsView: boolean;
  peopleView: boolean;
  activityView: boolean;
}

export interface GrowthOsHomeView {
  metrics: GrowthOsHomeMetrics;
  period: GrowthOsHomePeriodView | null;
  funnel: GrowthOsHomeFunnel | null;
  attention: GrowthOsHomeAttentionItem[];
  /** Conservado en proyección legacy. */
  opportunities: GrowthOsHomeOpportunityItem[];
  activity: GrowthOsHomeActivityItem[];
  origins: GrowthOsHomeOriginItem[];
  /** Solo ejecutivos / responsables reales (no «Sin responsable»). */
  owners: GrowthOsHomeOwnerRow[];
  /** Activas sin responsable; pendiente de asignación. */
  unassignedOwner: GrowthOsHomeUnassignedOwner | null;
  nextSteps: GrowthOsHomeNextStep[];
  denominators: {
    captacion: string;
    stock: string;
    cohorte: string;
  };
  rateNote: string;
  capabilities: GrowthOsHomeCapabilities;
  /** Comparación contra la ventana anterior. Ausente si no hay período resuelto. */
  trends?: HomeMetricTrends;
}

const ATTENTION_LIMIT = 4;
const OPPORTUNITY_LIMIT = 5;
const ORIGIN_LIMIT = 6;
const OWNER_LIMIT = 6;
const ACTIVITY_FEED_LIMIT = 5;

const DEFAULT_CAPABILITIES: GrowthOsHomeCapabilities = {
  salesView: false,
  salesOperate: false,
  salesRead: false,
  campaignsView: false,
  analyticsView: false,
  peopleView: false,
  activityView: false,
};

export function emptyGrowthOsHomeView(
  capabilities: GrowthOsHomeCapabilities = DEFAULT_CAPABILITIES
): GrowthOsHomeView {
  return {
    metrics: {
      nuevosProspectos: 0,
      oportunidadesActivas: 0,
      ganadas: 0,
      porAtender: 0,
      actividad: 0,
      personas: 0,
      oportunidades: 0,
    },
    period: null,
    funnel: null,
    attention: [],
    opportunities: [],
    activity: [],
    origins: [],
    owners: [],
    unassignedOwner: null,
    nextSteps: [],
    denominators: { ...CONVERSION_DENOMINATORS },
    rateNote: CONVERSION_RATE_NOTE,
    capabilities,
  };
}

function share(count: number, total: number): number | null {
  if (total <= 0) return null;
  return count / total;
}

export type GrowthOsHomeFunnelStageOrder = {
  /** Debe coincidir con el embudo que Home presenta; si no, se ignora. */
  funnelKey: string;
  stages: Array<{ key: string; label: string }>;
};

export function pickPrimaryFunnel(
  analytics: ConversionAnalyticsResponse
): ConversionAnalyticsResponse["stock"]["byFunnel"][number] | null {
  const rows = analytics.stock.byFunnel.filter((f) => f.funnelKey !== "sin-embudo");
  const pool = rows.length > 0 ? rows : analytics.stock.byFunnel;
  if (pool.length === 0) return null;
  return pool
    .slice()
    .sort(
      (a, b) =>
        b.stages.reduce((s, r) => s + r.count, 0) -
          a.stages.reduce((s, r) => s + r.count, 0) ||
        a.funnelLabel.localeCompare(b.funnelLabel, "es")
    )[0]!;
}

/** Presentación: Conversion Engine usa la clave como label cuando no hay nombre. */
function displayFunnelLabel(funnelKey: string, funnelLabel: string): string {
  const raw = funnelLabel.trim() || funnelKey.trim();
  if (!raw || raw === "sin-embudo") return "Sin embudo";
  if (raw === "default") return "Ventas";
  return raw;
}

function periodWonForFunnel(
  analytics: ConversionAnalyticsResponse,
  funnelKey: string
): number {
  const row = analytics.closures.byFunnel.find((f) => f.funnelKey === funnelKey);
  if (row) return row.won;
  // Sin corte por embudo (fixtures antiguos / un solo total): el total del Espacio.
  if (analytics.closures.byFunnel.length === 0) return analytics.closures.won;
  return 0;
}

function projectFunnel(
  analytics: ConversionAnalyticsResponse,
  stageOrder?: GrowthOsHomeFunnelStageOrder
): GrowthOsHomeFunnel | null {
  const primary = pickPrimaryFunnel(analytics);
  if (!primary) return null;
  const countByKey = new Map(primary.stages.map((row) => [row.key, row]));
  const orderForPrimary =
    stageOrder &&
    stageOrder.funnelKey === primary.funnelKey &&
    stageOrder.stages.length > 0
      ? stageOrder.stages
      : null;
  const orderedStages = orderForPrimary
    ? orderForPrimary.map((stage) => {
        const found = countByKey.get(stage.key);
        return {
          key: stage.key,
          label: found?.label ?? stage.label,
          count: found?.count ?? 0,
        };
      })
    : primary.stages;
  // Incluye etapas con stock 0 solo cuando hay orden del embudo (silueta completa).
  const visible = orderedStages.filter((row) =>
    orderForPrimary ? true : row.count > 0
  );
  const stockTotal = visible.reduce((sum, row) => sum + row.count, 0);
  const cohort =
    analytics.cohorts.byFunnel.find((row) => row.key === primary.funnelKey) ??
    null;
  return {
    funnelKey: primary.funnelKey,
    funnelLabel: displayFunnelLabel(primary.funnelKey, primary.funnelLabel),
    stages: visible.map((row) => ({
      key: row.key,
      label: row.label,
      count: row.count,
      shareOfStock: share(row.count, stockTotal),
    })),
    stockTotal,
    cohortRate: cohort?.rate ?? null,
    cohortSize: cohort?.cohort ?? 0,
    cohortWon: cohort?.won ?? 0,
    periodWon: periodWonForFunnel(analytics, primary.funnelKey),
    stockDenominator: CONVERSION_DENOMINATORS.stock,
    cohortDenominator: CONVERSION_DENOMINATORS.cohorte,
    cohortNote: CONVERSION_RATE_NOTE,
  };
}

function projectOrigins(rows: ConversionCountRow[]): GrowthOsHomeOriginItem[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows
    .filter((row) => row.count > 0)
    .slice(0, ORIGIN_LIMIT)
    .map((row) => ({
      label: humanizeOriginDisplayLabel(row.label),
      count: row.count,
      share: share(row.count, total),
    }));
}

const UNASSIGNED_OWNER_LABEL = "Sin responsable";

function projectOwners(rows: ConversionOwnerRow[]): {
  owners: GrowthOsHomeOwnerRow[];
  unassignedOwner: GrowthOsHomeUnassignedOwner | null;
} {
  let unassignedOpen = 0;
  const owners: GrowthOsHomeOwnerRow[] = [];
  for (const row of rows) {
    if (row.open <= 0 && row.won <= 0) continue;
    // Stock sin responsable: pendiente de asignación, no entra como ejecutivo.
    if (row.userId == null && row.label === UNASSIGNED_OWNER_LABEL) {
      unassignedOpen += row.open;
      continue;
    }
    // Cierres sin atribución u otros buckets nulos: no son carga operativa del Inicio.
    if (row.userId == null) continue;
    owners.push({
      userId: row.userId,
      label: row.label,
      open: row.open,
      won: row.won,
    });
  }
  return {
    owners: owners.slice(0, OWNER_LIMIT),
    unassignedOwner: unassignedOpen > 0 ? { open: unassignedOpen } : null,
  };
}

function attentionFromCommercial(
  rows: CommercialQueueRow[]
): GrowthOsHomeAttentionItem[] {
  return rows.slice(0, ATTENTION_LIMIT).map((row) => ({
    id: row.id,
    displayName: row.personaLabel,
    contextLabel: `${row.stageLabel} · ${row.funnelName}`,
    originLabel: row.funnelName,
    nextActionLabel: row.nextActionSummary || GROWTH_NO_NEXT_ACTION_LABEL,
    updatedAt: row.dueAt ?? new Date(0).toISOString(),
    band: row.band,
    bandLabel: row.bandLabel,
    reasonLabel: row.bandLabel,
    ageLabel: row.ageLabel ?? "—",
    href: row.href,
    ownerLabel: row.ownerLabel,
  }));
}

function bandHref(
  band: "overdue" | "unfollowed" | "stale" | "unassigned",
  spaceWide: boolean
): string {
  if (spaceWide) return `/admin/ventas?banda=${band}`;
  if (band === "unassigned") return "/admin/conversion";
  return `/admin/ventas/mi-trabajo#${band}`;
}

/**
 * Acciones concretas respaldadas por conteos de la cola comercial.
 * Sin atajos genéricos (campañas, personas, automatizaciones) ni inventos.
 */
function buildNextSteps(input: {
  overdue: number;
  unfollowed: number;
  stale: number;
  unassigned: number;
  spaceWide: boolean;
  capabilities: GrowthOsHomeCapabilities;
}): GrowthOsHomeNextStep[] {
  const steps: GrowthOsHomeNextStep[] = [];
  const canSales =
    input.capabilities.salesView ||
    input.capabilities.salesOperate ||
    input.capabilities.salesRead;
  if (!canSales) return steps;

  const pushBand = (
    id: string,
    count: number,
    singular: string,
    plural: string,
    detail: string,
    band: "overdue" | "unfollowed" | "stale" | "unassigned"
  ) => {
    if (count <= 0) return;
    if (band === "unassigned" && !input.spaceWide) return;
    steps.push({
      id,
      label: count === 1 ? singular : plural.replace("{n}", String(count)),
      detail,
      href: bandHref(band, input.spaceWide),
      count,
    });
  };

  pushBand(
    "overdue",
    input.overdue,
    "Atender 1 oportunidad vencida",
    "Atender {n} oportunidades vencidas",
    "La próxima acción ya pasó la fecha",
    "overdue"
  );
  pushBand(
    "unfollowed",
    input.unfollowed,
    "Definir seguimiento a 1 oportunidad",
    "Definir seguimiento a {n} oportunidades",
    "Abiertas sin próxima acción",
    "unfollowed"
  );
  pushBand(
    "stale",
    input.stale,
    "Reactivar 1 oportunidad estancada",
    "Reactivar {n} oportunidades estancadas",
    "Sin movimiento reciente",
    "stale"
  );
  pushBand(
    "unassigned",
    input.unassigned,
    "Asignar responsable a 1 oportunidad",
    "Asignar responsable a {n} oportunidades",
    "Pendientes de asignación",
    "unassigned"
  );

  return steps.slice(0, 4);
}

/**
 * Proyección del Inicio con Conversion Engine + Panel comercial + actividad.
 */
export function projectGrowthOsHomeDashboard(input: {
  analytics: ConversionAnalyticsResponse | null;
  commercialRows: CommercialQueueRow[];
  commercialCounts: {
    overdue: number;
    unfollowed: number;
    stale: number;
    unassigned?: number;
  };
  activityCountInPeriod: number;
  activities: GrowthOsHomeActivityItem[];
  periodLabel: string;
  capabilities: GrowthOsHomeCapabilities;
  hasCampaigns: boolean;
  hasAutomations: boolean;
  personasCount?: number;
  /** Orden de etapas abiertas del embudo que Home presenta (misma clave). */
  funnelStageOrder?: GrowthOsHomeFunnelStageOrder;
}): GrowthOsHomeView {
  const capabilities = input.capabilities;
  const analytics = input.analytics;
  const porAtender =
    input.commercialCounts.overdue +
    input.commercialCounts.unfollowed +
    input.commercialCounts.stale;
  const spaceWide = capabilities.salesView || capabilities.salesRead;

  const stockTotal =
    analytics?.stock.byFunnel.reduce(
      (sum, funnel) => sum + funnel.stages.reduce((s, r) => s + r.count, 0),
      0
    ) ?? 0;

  const projected = analytics
    ? projectOwners(analytics.owners)
    : { owners: [] as GrowthOsHomeOwnerRow[], unassignedOwner: null };
  const ownersVisible = spaceWide ? projected.owners : [];
  const unassignedVisible = spaceWide ? projected.unassignedOwner : null;
  const unassignedCount =
    input.commercialCounts.unassigned ?? unassignedVisible?.open ?? 0;

  return {
    metrics: {
      nuevosProspectos: analytics?.captacion.total ?? 0,
      oportunidadesActivas: stockTotal,
      ganadas: analytics?.closures.won ?? 0,
      porAtender,
      actividad: input.activityCountInPeriod,
      personas: input.personasCount ?? 0,
      oportunidades: stockTotal,
    },
    period: analytics
      ? {
          preset: analytics.period.preset,
          start: analytics.period.start,
          end: analytics.period.end,
          label: input.periodLabel,
        }
      : null,
    funnel:
      capabilities.salesView || capabilities.salesRead || capabilities.salesOperate
        ? analytics
          ? projectFunnel(analytics, input.funnelStageOrder)
          : null
        : null,
    attention: attentionFromCommercial(input.commercialRows),
    opportunities: [],
    activity: input.activities.slice(0, ACTIVITY_FEED_LIMIT),
    origins: analytics ? projectOrigins(analytics.captacion.byOrigin) : [],
    owners: ownersVisible,
    unassignedOwner: unassignedVisible,
    nextSteps: buildNextSteps({
      overdue: input.commercialCounts.overdue,
      unfollowed: input.commercialCounts.unfollowed,
      stale: input.commercialCounts.stale,
      unassigned: spaceWide ? unassignedCount : 0,
      spaceWide,
      capabilities,
    }),
    denominators: { ...CONVERSION_DENOMINATORS },
    rateNote: CONVERSION_RATE_NOTE,
    capabilities,
  };
}

/**
 * Proyección legacy desde Personas (pruebas e2e / compat).
 * No inventa tendencias; conserva el contrato de métricas antiguas.
 */
export function projectGrowthOsHome(input: {
  personas: GrowthPersonaListItemView[];
  activityCount: number;
  activities: GrowthOsHomeActivityItem[];
  capabilities?: GrowthOsHomeCapabilities;
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

  const originTotal = [...originsMap.values()].reduce((a, b) => a + b, 0);
  const origins = [...originsMap.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: share(count, originTotal),
    }))
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

  const oportunidades = personas.reduce(
    (sum, item) => sum + item.opportunityCount,
    0
  );
  const porAtender = needingAttention.length;
  const capabilities = input.capabilities ?? DEFAULT_CAPABILITIES;

  return {
    metrics: {
      nuevosProspectos: 0,
      oportunidadesActivas: oportunidades,
      ganadas: 0,
      porAtender,
      actividad: input.activityCount,
      personas: personas.length,
      oportunidades,
    },
    period: null,
    funnel: null,
    attention: needingAttention.slice(0, ATTENTION_LIMIT).map((item) => {
      const situation = humanizeHomeSituation(item.opportunitySummary);
      return {
        id: item.id,
        displayName: item.displayName,
        contextLabel: situation.situationLabel ?? item.originLabel,
        originLabel: humanizeOriginDisplayLabel(item.originLabel),
        typeLabel: situation.typeLabel,
        situationLabel: situation.situationLabel,
        opportunitySummary: item.opportunitySummary,
        nextActionLabel: item.nextActionLabel,
        updatedAt: item.updatedAt,
        band: null,
        bandLabel: "Atención",
        reasonLabel: situation.situationLabel ?? "Pendiente",
        ageLabel: "—",
        href: `/admin/personas/${encodeURIComponent(item.id)}`,
      };
    }),
    opportunities,
    activity: input.activities,
    origins,
    owners: [],
    unassignedOwner: null,
    nextSteps:
      porAtender > 0 && capabilities.peopleView
        ? [
            {
              id: "people-follow-up",
              label:
                porAtender === 1
                  ? "Revisar 1 persona con próxima acción"
                  : `Revisar ${porAtender} personas con próxima acción`,
              detail: "Desde el listado de Personas del Espacio",
              href: "/admin/personas",
              count: porAtender,
            },
          ]
        : [],
    denominators: { ...CONVERSION_DENOMINATORS },
    rateNote: CONVERSION_RATE_NOTE,
    capabilities,
  };
}
