/**
 * Comparación del Inicio contra la ventana inmediatamente anterior, de igual duración.
 * Los conteos salen de fechas reales (apertura, cierre, actividad, stock reconstruido).
 */

export const HOME_TREND_BUCKETS = 14;

export interface HomeMetricTrend {
  /** null cuando el período anterior es 0 y el actual no: no hay base para un porcentaje. */
  deltaPct: number | null;
  /** Conteos por tramo del período actual. Vacío si no hay serie histórica. */
  series: number[];
  higherIsBetter: boolean;
}

export interface HomeMetricTrends {
  nuevosProspectos: HomeMetricTrend;
  oportunidadesActivas: HomeMetricTrend;
  ganadas: HomeMetricTrend;
  porAtender: HomeMetricTrend;
  actividad: HomeMetricTrend;
}

export interface HomeOpenStockRow {
  openedAt?: string | null;
  closedAt?: string | null;
}

export function previousEqualWindow(
  startIso: string,
  endIso: string
): { start: string; end: string } {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const span = Math.max(end - start, 1);
  return {
    start: new Date(start - span).toISOString(),
    end: startIso,
  };
}

/** Porcentaje de cambio. null si no existe base anterior (anterior 0 y actual > 0). */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous <= 0) return current <= 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function inWindow(iso: string | null | undefined, startMs: number, endMs: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t >= startMs && t < endMs;
}

export function countInWindow(
  timestamps: Array<string | null | undefined>,
  startIso: string,
  endIso: string
): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  let n = 0;
  for (const iso of timestamps) {
    if (inWindow(iso, start, end)) n += 1;
  }
  return n;
}

export function bucketSeries(
  timestamps: Array<string | null | undefined>,
  startIso: string,
  endIso: string,
  buckets = HOME_TREND_BUCKETS
): number[] {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const span = Math.max(end - start, 1);
  const series = Array.from({ length: buckets }, () => 0);
  for (const iso of timestamps) {
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isNaN(t) || t < start || t >= end) continue;
    const index = Math.min(buckets - 1, Math.floor(((t - start) / span) * buckets));
    series[index] += 1;
  }
  return series;
}

function openAt(rows: HomeOpenStockRow[], atMs: number): number {
  let n = 0;
  for (const row of rows) {
    const opened = row.openedAt ? Date.parse(row.openedAt) : Number.NaN;
    if (Number.isNaN(opened) || opened >= atMs) continue;
    const closed = row.closedAt ? Date.parse(row.closedAt) : Number.NaN;
    if (!Number.isNaN(closed) && closed < atMs) continue;
    n += 1;
  }
  return n;
}

/** Stock abierto reconstruido con openedAt/closedAt a lo largo del período. */
export function openStockSeries(
  rows: HomeOpenStockRow[],
  startIso: string,
  endIso: string,
  buckets = HOME_TREND_BUCKETS
): { series: number[]; atStart: number } {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const span = Math.max(end - start, 1);
  const series = Array.from({ length: buckets }, (_, index) =>
    openAt(rows, start + ((index + 1) / buckets) * span)
  );
  return { series, atStart: openAt(rows, start) };
}

export function projectHomeMetricTrends(input: {
  periodStart: string;
  periodEnd: string;
  openedAt: Array<string | null | undefined>;
  closedWonAt: Array<string | null | undefined>;
  activityAt: Array<string | null | undefined>;
  openRows: HomeOpenStockRow[];
  current: {
    nuevosProspectos: number;
    oportunidadesActivas: number;
    ganadas: number;
    porAtender: number;
    actividad: number;
  };
}): HomeMetricTrends {
  const prev = previousEqualWindow(input.periodStart, input.periodEnd);
  const stock = openStockSeries(input.openRows, input.periodStart, input.periodEnd);
  return {
    nuevosProspectos: {
      deltaPct: percentChange(
        input.current.nuevosProspectos,
        countInWindow(input.openedAt, prev.start, prev.end)
      ),
      series: bucketSeries(input.openedAt, input.periodStart, input.periodEnd),
      higherIsBetter: true,
    },
    oportunidadesActivas: {
      deltaPct: percentChange(input.current.oportunidadesActivas, stock.atStart),
      series: stock.series,
      higherIsBetter: true,
    },
    ganadas: {
      deltaPct: percentChange(
        input.current.ganadas,
        countInWindow(input.closedWonAt, prev.start, prev.end)
      ),
      series: bucketSeries(input.closedWonAt, input.periodStart, input.periodEnd),
      higherIsBetter: true,
    },
    porAtender: {
      deltaPct: null,
      series: Array.from({ length: HOME_TREND_BUCKETS }, () => input.current.porAtender),
      higherIsBetter: false,
    },
    actividad: {
      deltaPct: percentChange(
        input.current.actividad,
        countInWindow(input.activityAt, prev.start, prev.end)
      ),
      series: bucketSeries(input.activityAt, input.periodStart, input.periodEnd),
      higherIsBetter: true,
    },
  };
}
