/**
 * Conversion Engine fase 3 — analítica de conversión.
 * Función pura sobre documentos ya filtrados por Espacio. Sin I/O.
 */

import {
  growthFunnelResultLabel,
  isGrowthFunnelResultKey,
} from "@/core/growth/funnel-types";
import type { GrowthOrigin } from "@/core/growth/types";
import {
  acquisitionOriginGroupLabel,
  computeConversionRate,
} from "./analytics-aggregate";
import { isTimestampInPeriod, type AnalyticsPeriod } from "./analytics-period";

export const CONVERSION_DENOMINATORS = {
  captacion:
    "Oportunidades con fecha de apertura en el período, incluidas las archivadas después.",
  stock: "Oportunidades abiertas ahora. No depende del período.",
  cohorte:
    "Oportunidades abiertas en el período que no están archivadas. La tasa es el estado al momento de la consulta.",
} as const;

export const CONVERSION_RATE_NOTE =
  "Tasa al momento de la consulta. Las abiertas siguen en curso.";

export const CONVERSION_LOSS_REASONS_NOTE =
  "Los motivos de pérdida no se registran.";

export type ConversionCountRow = { key: string; label: string; count: number };

export type ConversionCohortRow = {
  key: string;
  label: string;
  cohort: number;
  won: number;
  open: number;
  lost: number;
  handedOff: number;
  rate: number | null;
};

export type ConversionOwnerRow = {
  userId: string | null;
  label: string;
  open: number;
  won: number;
  lost: number;
  handedOff: number;
  wonCycleMedianMs: number | null;
  wonCycleCount: number;
};

export type ConversionAnalyticsQuality = {
  sinFechaApertura: number;
  sinFechaCierre: number;
  historialIncompleto: number;
  movimientoIlegible: number;
  campanaNoRegistrada: number;
  etapaDeSalidaNoRegistrada: number;
};

export type ConversionOpportunityInput = {
  _id: string;
  tenantId: string;
  status: string;
  openedAt?: string;
  closedAt?: string;
  origin?: {
    kind?: string;
    channel?: string;
    formId?: string;
    campaign?: string;
  } | null;
  funnelKey?: string;
  ownerUserId?: string;
};

export type ConversionActivityInput = {
  _id: string;
  tenantId: string;
  oportunidadId?: string;
  kind: string;
  occurredAt?: string;
  summary?: string;
  payload?: Record<string, unknown>;
};

export type ConversionFunnelInput = {
  tenantId: string;
  key: string;
  stages: Array<{ key: string; label: string }>;
};

export type ConversionCampaignInput = {
  tenantId: string;
  _id: string;
  name: string;
  trackingKey: string;
};

export type ConversionMemberInput = {
  userId: string;
  label: string;
  active: boolean;
};

export type BuildConversionAnalyticsInput = {
  tenantId: string;
  period: AnalyticsPeriod;
  readAt: string;
  opportunities: ConversionOpportunityInput[];
  activities: ConversionActivityInput[];
  funnels: ConversionFunnelInput[];
  campaigns: ConversionCampaignInput[];
  members: ConversionMemberInput[];
  formNameById?: Map<string, string>;
};

export type ConversionMovementRow = {
  /** Etapa de salida (`fromState`). */
  key: string;
  label: string;
  advance: number;
  lost: number;
  won: number;
  handedOff: number;
  archived: number;
  /** Oportunidades distintas que salieron de la etapa en el período. */
  opportunities: number;
};

export type ConversionDwellRow = {
  key: string;
  label: string;
  medianMs: number | null;
  count: number;
  inProgress: number;
};

export type ConversionCycleStat = { medianMs: number | null; count: number };

export type ConversionAnalyticsResponse = {
  tenantId: string;
  period: AnalyticsPeriod;
  readAt: string;
  denominators: {
    captacion: string;
    stock: string;
    cohorte: string;
  };
  rateNote: string;
  captacion: {
    total: number;
    archivedNow: number;
    byFunnel: ConversionCountRow[];
    byOrigin: ConversionCountRow[];
  };
  stock: {
    byFunnel: Array<{
      funnelKey: string;
      funnelLabel: string;
      stages: ConversionCountRow[];
    }>;
  };
  movement: {
    byFunnel: Array<{
      funnelKey: string;
      funnelLabel: string;
      stages: ConversionMovementRow[];
    }>;
    ilegible: number;
  };
  closures: { won: number; lost: number; handedOff: number };
  losses: {
    total: number;
    byExitStage: ConversionCountRow[];
    reasonsRecorded: false;
    reasonsNote: string;
  };
  dwell: {
    byFunnel: Array<{
      funnelKey: string;
      funnelLabel: string;
      stages: ConversionDwellRow[];
    }>;
  };
  cycle: { won: ConversionCycleStat; lost: ConversionCycleStat };
  cohorts: {
    byFunnel: ConversionCohortRow[];
    byCampaign: ConversionCohortRow[];
    bySource: ConversionCohortRow[];
  };
  owners: ConversionOwnerRow[];
  quality: ConversionAnalyticsQuality;
};

const NO_FUNNEL_KEY = "sin-embudo";
const NO_FUNNEL_LABEL = "Sin embudo";
const UNREGISTERED_CAMPAIGN_KEY = "campana-no-registrada";
const UNREGISTERED_CAMPAIGN_LABEL = "Campaña no registrada";
const OWNER_NONE_LABEL = "Sin responsable";
const OWNER_NO_ATTRIBUTION_LABEL = "Sin atribución de responsable";
const OWNER_INACTIVE_LABEL = "Responsable no vigente";

const KIND_OPENED = "opportunity_opened";
const KIND_TRANSITIONED = "opportunity_transitioned";
const KIND_ASSIGNED = "opportunity_assigned";

function bump(map: Map<string, number>, key: string, n = 1): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isResultStatus(status: string): boolean {
  return isGrowthFunnelResultKey(status);
}

function sortCountRows(
  entries: Array<{ key: string; label: string; count: number }>
): ConversionCountRow[] {
  return entries
    .filter((row) => row.count > 0)
    .sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, "es")
    );
}

export function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function msBetween(fromIso: string, toIso: string): number | null {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return to - from;
}

/**
 * Responsable al que se atribuye un cierre: la última asignación con
 * `occurredAt <= closedAt`. `null` = sin atribución de responsable, nunca el
 * responsable actual.
 */
function closureOwnerUserId(
  activities: ConversionActivityInput[],
  opportunityId: string,
  closedAt: string
): string | null {
  const prior = activities
    .filter(
      (a) =>
        a.oportunidadId === opportunityId &&
        a.kind === KIND_ASSIGNED &&
        typeof a.occurredAt === "string" &&
        a.occurredAt <= closedAt
    )
    .sort((a, b) => a.occurredAt!.localeCompare(b.occurredAt!));
  const last = prior.at(-1);
  if (!last) return null;
  const toUserId = last.payload?.toUserId;
  if (typeof toUserId !== "string" || toUserId.trim() === "") return null;
  return toUserId.trim();
}

type JourneyInterval = { stage: string; enter: string; exit: string | null };
type Journey = { complete: false } | { complete: true; intervals: JourneyInterval[] };

/** Recorrido de una oportunidad según el contrato; solo actividades + fechas. */
function buildJourney(
  opportunity: ConversionOpportunityInput,
  acts: ConversionActivityInput[]
): Journey {
  const incomplete: Journey = { complete: false };

  const openedActs = acts
    .filter((a) => a.kind === KIND_OPENED && nonEmptyString(a.occurredAt))
    .sort((a, b) => a.occurredAt!.localeCompare(b.occurredAt!));
  const openedAct = openedActs[0];
  const entry = openedAct?.occurredAt ?? opportunity.openedAt;
  if (!entry || Number.isNaN(Date.parse(entry))) return incomplete;

  const rawTransitions = acts.filter((a) => a.kind === KIND_TRANSITIONED);
  const transitions: Array<{ from: string; to: string; at: string }> = [];
  for (const t of rawTransitions) {
    const from = nonEmptyString(t.payload?.fromState);
    const to = nonEmptyString(t.payload?.toState);
    const at = t.occurredAt;
    if (!from || !to || !at || Number.isNaN(Date.parse(at))) return incomplete;
    transitions.push({ from, to, at });
  }
  transitions.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const openedStatus = nonEmptyString(openedAct?.payload?.status);
  const firstFrom = transitions[0]?.from ?? null;
  if (openedStatus && firstFrom && openedStatus !== firstFrom) return incomplete;
  const firstStage = openedStatus ?? firstFrom;
  if (!firstStage) return incomplete;

  const intervals: JourneyInterval[] = [];
  let current = firstStage;
  let enter = entry;
  for (const t of transitions) {
    if (t.from !== current) return incomplete;
    const length = msBetween(enter, t.at);
    if (length === null || length < 0) return incomplete;
    intervals.push({ stage: current, enter, exit: t.at });
    current = t.to;
    enter = t.at;
  }

  if (opportunity.status !== current) return incomplete;

  const closedAt = nonEmptyString(opportunity.closedAt);
  if (closedAt) {
    const length = msBetween(enter, closedAt);
    if (length === null || length < 0) return incomplete;
    intervals.push({ stage: current, enter, exit: closedAt });
  } else {
    intervals.push({ stage: current, enter, exit: null });
  }
  return { complete: true, intervals };
}

type FunnelBucket = { key: string; label: string };

type OwnerAccumulator = {
  userId: string | null;
  label: string;
  open: number;
  won: number;
  lost: number;
  handedOff: number;
  wonCycles: number[];
};

type CohortAccumulator = {
  key: string;
  label: string;
  cohort: number;
  won: number;
  open: number;
  lost: number;
  handedOff: number;
};

export function buildConversionAnalytics(
  input: BuildConversionAnalyticsInput
): ConversionAnalyticsResponse {
  const { tenantId, period, readAt, formNameById } = input;
  const { start, end } = period;

  const opportunities = input.opportunities.filter(
    (o) => o.tenantId === tenantId
  );
  const oppById = new Map(opportunities.map((o) => [o._id, o] as const));

  const activities = input.activities.filter(
    (a) =>
      a.tenantId === tenantId &&
      typeof a.oportunidadId === "string" &&
      a.oportunidadId !== "" &&
      oppById.has(a.oportunidadId)
  );
  const activitiesByOpp = new Map<string, ConversionActivityInput[]>();
  for (const a of activities) {
    const list = activitiesByOpp.get(a.oportunidadId!) ?? [];
    list.push(a);
    activitiesByOpp.set(a.oportunidadId!, list);
  }

  const funnelStages = new Map<string, Map<string, string>>();
  for (const f of input.funnels) {
    if (f.tenantId !== tenantId) continue;
    funnelStages.set(f.key, new Map(f.stages.map((s) => [s.key, s.label])));
  }

  const campaignByTracking = new Map(
    input.campaigns
      .filter((c) => c.tenantId === tenantId)
      .map((c) => [c.trackingKey, c] as const)
  );
  const memberByUserId = new Map<string, ConversionMemberInput>();
  for (const m of input.members) {
    if (!memberByUserId.has(m.userId)) memberByUserId.set(m.userId, m);
  }

  const funnelBucket = (o: ConversionOpportunityInput): FunnelBucket => {
    const key = nonEmptyString(o.funnelKey);
    return key
      ? { key, label: key }
      : { key: NO_FUNNEL_KEY, label: NO_FUNNEL_LABEL };
  };

  const stageLabel = (funnelKey: string | undefined, stage: string): string => {
    const fromFunnel = funnelKey
      ? funnelStages.get(funnelKey)?.get(stage)
      : undefined;
    return fromFunnel ?? growthFunnelResultLabel(stage) ?? stage;
  };

  const quality: ConversionAnalyticsQuality = {
    sinFechaApertura: 0,
    sinFechaCierre: 0,
    historialIncompleto: 0,
    movimientoIlegible: 0,
    campanaNoRegistrada: 0,
    etapaDeSalidaNoRegistrada: 0,
  };

  // --- Captación y cohortes -------------------------------------------------
  const captacionByFunnel = new Map<string, { label: string; count: number }>();
  const captacionByOrigin = new Map<string, number>();
  let captacionTotal = 0;
  let archivedNow = 0;

  const cohortByFunnel = new Map<string, CohortAccumulator>();
  const cohortByCampaign = new Map<string, CohortAccumulator>();
  const cohortBySource = new Map<string, CohortAccumulator>();

  const addToCohort = (
    map: Map<string, CohortAccumulator>,
    key: string,
    label: string,
    status: string
  ) => {
    let row = map.get(key);
    if (!row) {
      row = { key, label, cohort: 0, won: 0, open: 0, lost: 0, handedOff: 0 };
      map.set(key, row);
    }
    row.cohort += 1;
    if (status === "won") row.won += 1;
    else if (status === "lost") row.lost += 1;
    else if (status === "handed_off") row.handedOff += 1;
    else row.open += 1;
  };

  for (const o of opportunities) {
    const isResultWithoutClose =
      (o.status === "won" || o.status === "lost" || o.status === "handed_off") &&
      !nonEmptyString(o.closedAt);
    if (isResultWithoutClose) quality.sinFechaCierre += 1;

    if (!nonEmptyString(o.openedAt)) {
      quality.sinFechaApertura += 1;
      continue;
    }
    if (!isTimestampInPeriod(o.openedAt, start, end)) continue;

    captacionTotal += 1;
    if (o.status === "archived") archivedNow += 1;
    const funnel = funnelBucket(o);
    const prev = captacionByFunnel.get(funnel.key);
    captacionByFunnel.set(funnel.key, {
      label: funnel.label,
      count: (prev?.count ?? 0) + 1,
    });
    const sourceLabel = acquisitionOriginGroupLabel(
      (o.origin ?? null) as Pick<GrowthOrigin, "kind" | "channel" | "formId"> | null,
      formNameById
    );
    bump(captacionByOrigin, sourceLabel);

    if (o.status === "archived") continue;
    if (isResultWithoutClose) continue;

    addToCohort(cohortByFunnel, funnel.key, funnel.label, o.status);
    addToCohort(cohortBySource, sourceLabel, sourceLabel, o.status);

    const tracking = nonEmptyString(o.origin?.campaign);
    if (tracking) {
      const campaign = campaignByTracking.get(tracking);
      if (campaign) {
        addToCohort(
          cohortByCampaign,
          campaign.trackingKey,
          campaign.name,
          o.status
        );
      } else {
        quality.campanaNoRegistrada += 1;
        addToCohort(
          cohortByCampaign,
          UNREGISTERED_CAMPAIGN_KEY,
          UNREGISTERED_CAMPAIGN_LABEL,
          o.status
        );
      }
    }
  }

  const cohortRows = (map: Map<string, CohortAccumulator>): ConversionCohortRow[] =>
    [...map.values()]
      .map((row) => ({
        ...row,
        rate: computeConversionRate(row.won, row.cohort),
      }))
      .sort(
        (a, b) => b.cohort - a.cohort || a.label.localeCompare(b.label, "es")
      );

  // --- Stock -----------------------------------------------------------------
  const stockMap = new Map<
    string,
    { label: string; stages: Map<string, { label: string; count: number }> }
  >();
  for (const o of opportunities) {
    if (isResultStatus(o.status)) continue;
    const funnel = funnelBucket(o);
    let entry = stockMap.get(funnel.key);
    if (!entry) {
      entry = { label: funnel.label, stages: new Map() };
      stockMap.set(funnel.key, entry);
    }
    const prev = entry.stages.get(o.status);
    entry.stages.set(o.status, {
      label: stageLabel(o.funnelKey, o.status),
      count: (prev?.count ?? 0) + 1,
    });
  }

  // --- Movimiento ------------------------------------------------------------
  type MovementAcc = {
    label: string;
    stages: Map<
      string,
      ConversionMovementRow & { opps: Set<string> }
    >;
  };
  const movementMap = new Map<string, MovementAcc>();
  const transitionsByOpp = new Map<
    string,
    Array<{ from: string | null; to: string | null; at: string | undefined }>
  >();

  for (const a of activities) {
    if (a.kind !== KIND_TRANSITIONED) continue;
    const o = oppById.get(a.oportunidadId!)!;
    const from = nonEmptyString(a.payload?.fromState);
    const to = nonEmptyString(a.payload?.toState);
    const list = transitionsByOpp.get(o._id) ?? [];
    list.push({ from, to, at: a.occurredAt });
    transitionsByOpp.set(o._id, list);

    if (!isTimestampInPeriod(a.occurredAt, start, end)) continue;
    if (!from || !to) {
      quality.movimientoIlegible += 1;
      continue;
    }
    const funnel = funnelBucket(o);
    let acc = movementMap.get(funnel.key);
    if (!acc) {
      acc = { label: funnel.label, stages: new Map() };
      movementMap.set(funnel.key, acc);
    }
    let row = acc.stages.get(from);
    if (!row) {
      row = {
        key: from,
        label: stageLabel(o.funnelKey, from),
        advance: 0,
        lost: 0,
        won: 0,
        handedOff: 0,
        archived: 0,
        opportunities: 0,
        opps: new Set(),
      };
      acc.stages.set(from, row);
    }
    if (to === "lost") row.lost += 1;
    else if (to === "won") row.won += 1;
    else if (to === "handed_off") row.handedOff += 1;
    else if (to === "archived") row.archived += 1;
    else row.advance += 1;
    row.opps.add(o._id);
    row.opportunities = row.opps.size;
  }

  // --- Cierres, pérdidas, ciclo y responsables --------------------------------
  const closures = { won: 0, lost: 0, handedOff: 0 };
  const lossExitMap = new Map<string, { label: string; count: number }>();
  let lossTotal = 0;
  const wonCycles: number[] = [];
  const lostCycles: number[] = [];
  const owners = new Map<string, OwnerAccumulator>();

  const ownerRow = (
    key: string,
    userId: string | null,
    label: string
  ): OwnerAccumulator => {
    let row = owners.get(key);
    if (!row) {
      row = { userId, label, open: 0, won: 0, lost: 0, handedOff: 0, wonCycles: [] };
      owners.set(key, row);
    }
    return row;
  };
  const userRow = (userId: string): OwnerAccumulator => {
    const member = memberByUserId.get(userId);
    const label =
      member && member.active && nonEmptyString(member.label)
        ? member.label
        : OWNER_INACTIVE_LABEL;
    return ownerRow(`u:${userId}`, userId, label);
  };

  for (const o of opportunities) {
    if (!isResultStatus(o.status)) {
      const ownerId = nonEmptyString(o.ownerUserId);
      const row = ownerId
        ? userRow(ownerId)
        : ownerRow("none:open", null, OWNER_NONE_LABEL);
      row.open += 1;
      continue;
    }

    if (o.status !== "won" && o.status !== "lost" && o.status !== "handed_off") {
      continue;
    }
    const closedAt = nonEmptyString(o.closedAt);
    if (!closedAt || !isTimestampInPeriod(closedAt, start, end)) continue;

    const attributed = closureOwnerUserId(
      activitiesByOpp.get(o._id) ?? [],
      o._id,
      closedAt
    );
    const row = attributed
      ? userRow(attributed)
      : ownerRow("none:closure", null, OWNER_NO_ATTRIBUTION_LABEL);

    const cycle =
      nonEmptyString(o.openedAt) !== null
        ? msBetween(o.openedAt!, closedAt)
        : null;
    const usableCycle = cycle !== null && cycle >= 0 ? cycle : null;

    if (o.status === "won") {
      closures.won += 1;
      row.won += 1;
      if (usableCycle !== null) {
        wonCycles.push(usableCycle);
        row.wonCycles.push(usableCycle);
      }
    } else if (o.status === "handed_off") {
      closures.handedOff += 1;
      row.handedOff += 1;
    } else {
      closures.lost += 1;
      row.lost += 1;
      if (usableCycle !== null) lostCycles.push(usableCycle);
      lossTotal += 1;

      const exits = (transitionsByOpp.get(o._id) ?? [])
        .filter(
          (t) =>
            t.to === "lost" &&
            typeof t.at === "string" &&
            t.at !== "" &&
            t.at <= closedAt
        )
        .sort((a, b) => a.at!.localeCompare(b.at!));
      const exit = exits.at(-1);
      if (!exit || !exit.from) {
        quality.etapaDeSalidaNoRegistrada += 1;
      } else {
        const funnel = funnelBucket(o);
        const key = `${funnel.key}:${exit.from}`;
        const prev = lossExitMap.get(key);
        lossExitMap.set(key, {
          label: stageLabel(o.funnelKey, exit.from),
          count: (prev?.count ?? 0) + 1,
        });
      }
    }
  }

  // --- Permanencia -----------------------------------------------------------
  type DwellAcc = {
    label: string;
    stages: Map<
      string,
      { label: string; durations: number[]; inProgress: number }
    >;
  };
  const dwellMap = new Map<string, DwellAcc>();
  for (const o of opportunities) {
    const journey = buildJourney(o, activitiesByOpp.get(o._id) ?? []);
    if (!journey.complete) {
      quality.historialIncompleto += 1;
      continue;
    }
    const funnel = funnelBucket(o);
    for (const interval of journey.intervals) {
      if (isResultStatus(interval.stage)) continue;
      let acc = dwellMap.get(funnel.key);
      const ensureRow = () => {
        if (!acc) {
          acc = { label: funnel.label, stages: new Map() };
          dwellMap.set(funnel.key, acc);
        }
        let row = acc.stages.get(interval.stage);
        if (!row) {
          row = {
            label: stageLabel(o.funnelKey, interval.stage),
            durations: [],
            inProgress: 0,
          };
          acc.stages.set(interval.stage, row);
        }
        return row;
      };
      if (interval.exit === null) {
        if (!isResultStatus(o.status) && Date.parse(readAt) >= Date.parse(interval.enter)) {
          ensureRow().inProgress += 1;
        }
        continue;
      }
      if (!isTimestampInPeriod(interval.exit, start, end)) continue;
      const duration = msBetween(interval.enter, interval.exit);
      if (duration === null || duration < 0) continue;
      ensureRow().durations.push(duration);
    }
  }

  // --- Armado de la respuesta -------------------------------------------------
  const byFunnelSorted = <T extends { funnelLabel: string }>(rows: T[]): T[] =>
    rows.sort((a, b) => a.funnelLabel.localeCompare(b.funnelLabel, "es"));

  const ownerRows: ConversionOwnerRow[] = [...owners.values()]
    .map((row) => ({
      userId: row.userId,
      label: row.label,
      open: row.open,
      won: row.won,
      lost: row.lost,
      handedOff: row.handedOff,
      wonCycleMedianMs: medianOf(row.wonCycles),
      wonCycleCount: row.wonCycles.length,
    }))
    .sort(
      (a, b) =>
        b.open + b.won + b.lost + b.handedOff -
          (a.open + a.won + a.lost + a.handedOff) ||
        a.label.localeCompare(b.label, "es")
    );

  return {
    tenantId,
    period,
    readAt,
    denominators: { ...CONVERSION_DENOMINATORS },
    rateNote: CONVERSION_RATE_NOTE,
    captacion: {
      total: captacionTotal,
      archivedNow,
      byFunnel: sortCountRows(
        [...captacionByFunnel.entries()].map(([key, v]) => ({
          key,
          label: v.label,
          count: v.count,
        }))
      ),
      byOrigin: sortCountRows(
        [...captacionByOrigin.entries()].map(([label, count]) => ({
          key: label,
          label,
          count,
        }))
      ),
    },
    stock: {
      byFunnel: byFunnelSorted(
        [...stockMap.entries()].map(([funnelKey, v]) => ({
          funnelKey,
          funnelLabel: v.label,
          stages: sortCountRows(
            [...v.stages.entries()].map(([key, s]) => ({
              key,
              label: s.label,
              count: s.count,
            }))
          ),
        }))
      ),
    },
    movement: {
      byFunnel: byFunnelSorted(
        [...movementMap.entries()].map(([funnelKey, v]) => ({
          funnelKey,
          funnelLabel: v.label,
          stages: [...v.stages.values()]
            .map(({ opps: _opps, ...row }) => row)
            .sort(
              (a, b) =>
                b.advance + b.lost + b.won + b.handedOff + b.archived -
                  (a.advance + a.lost + a.won + a.handedOff + a.archived) ||
                a.label.localeCompare(b.label, "es")
            ),
        }))
      ),
      ilegible: quality.movimientoIlegible,
    },
    closures,
    losses: {
      total: lossTotal,
      byExitStage: sortCountRows(
        [...lossExitMap.entries()].map(([key, v]) => ({
          key,
          label: v.label,
          count: v.count,
        }))
      ),
      reasonsRecorded: false,
      reasonsNote: CONVERSION_LOSS_REASONS_NOTE,
    },
    dwell: {
      byFunnel: byFunnelSorted(
        [...dwellMap.entries()].map(([funnelKey, v]) => ({
          funnelKey,
          funnelLabel: v.label,
          stages: [...v.stages.entries()]
            .map(([key, s]) => ({
              key,
              label: s.label,
              medianMs: medianOf(s.durations),
              count: s.durations.length,
              inProgress: s.inProgress,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, "es")),
        }))
      ),
    },
    cycle: {
      won: { medianMs: medianOf(wonCycles), count: wonCycles.length },
      lost: { medianMs: medianOf(lostCycles), count: lostCycles.length },
    },
    cohorts: {
      byFunnel: cohortRows(cohortByFunnel),
      byCampaign: cohortRows(cohortByCampaign),
      bySource: cohortRows(cohortBySource),
    },
    owners: ownerRows,
    quality,
  };
}
