/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 — resolución de períodos Analítica V1.
 * Timezone V1: UTC. Intervalo [start, end). Sin comparación vs período anterior.
 */

export const ANALYTICS_PERIOD_PRESETS = [
  "last_7d",
  "last_30d",
  "this_month",
  "previous_month",
  "custom",
] as const;

export type AnalyticsPeriodPreset = (typeof ANALYTICS_PERIOD_PRESETS)[number];

export type AnalyticsPeriod = {
  preset: AnalyticsPeriodPreset;
  start: string;
  end: string;
  timezone: "UTC";
};

export type ResolveAnalyticsPeriodInput = {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
};

export type ResolveAnalyticsPeriodResult =
  | { ok: true; period: AnalyticsPeriod }
  | { ok: false; error: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_CUSTOM_DAYS = 366;

function isPreset(value: string): value is AnalyticsPeriodPreset {
  return (ANALYTICS_PERIOD_PRESETS as readonly string[]).includes(value);
}

function toIso(d: Date): string {
  return d.toISOString();
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function parseIsoInstant(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Inclusión/exclusión congelada: [start, end). */
export function isTimestampInPeriod(
  iso: string | undefined | null,
  start: string,
  end: string
): boolean {
  if (!iso) return false;
  return iso >= start && iso < end;
}

export function resolveAnalyticsPeriod(
  input: ResolveAnalyticsPeriodInput = {}
): ResolveAnalyticsPeriodResult {
  const now = input.now ?? new Date();
  const rawPreset = (input.preset ?? "last_30d").trim() || "last_30d";

  if (!isPreset(rawPreset)) {
    return {
      ok: false,
      error: `Período inválido: ${rawPreset}. Use last_7d, last_30d, this_month, previous_month o custom.`,
    };
  }

  if (rawPreset === "custom") {
    const fromRaw = input.from?.trim();
    const toRaw = input.to?.trim();
    if (!fromRaw || !toRaw) {
      return {
        ok: false,
        error: "El rango personalizado requiere from y to (ISO8601).",
      };
    }
    const startDate = parseIsoInstant(fromRaw);
    const endDate = parseIsoInstant(toRaw);
    if (!startDate || !endDate) {
      return {
        ok: false,
        error: "from/to deben ser fechas ISO8601 válidas.",
      };
    }
    if (!(endDate.getTime() > startDate.getTime())) {
      return {
        ok: false,
        error: "El fin del período debe ser posterior al inicio (end > start).",
      };
    }
    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs > MAX_CUSTOM_DAYS * MS_PER_DAY) {
      return {
        ok: false,
        error: `El rango personalizado no puede superar ${MAX_CUSTOM_DAYS} días.`,
      };
    }
    return {
      ok: true,
      period: {
        preset: "custom",
        start: toIso(startDate),
        end: toIso(endDate),
        timezone: "UTC",
      },
    };
  }

  if (rawPreset === "last_7d") {
    const end = now;
    const start = new Date(end.getTime() - 7 * MS_PER_DAY);
    return {
      ok: true,
      period: {
        preset: "last_7d",
        start: toIso(start),
        end: toIso(end),
        timezone: "UTC",
      },
    };
  }

  if (rawPreset === "last_30d") {
    const end = now;
    const start = new Date(end.getTime() - 30 * MS_PER_DAY);
    return {
      ok: true,
      period: {
        preset: "last_30d",
        start: toIso(start),
        end: toIso(end),
        timezone: "UTC",
      },
    };
  }

  if (rawPreset === "this_month") {
    const end = now;
    const start = startOfUtcMonth(now);
    return {
      ok: true,
      period: {
        preset: "this_month",
        start: toIso(start),
        end: toIso(end),
        timezone: "UTC",
      },
    };
  }

  // previous_month
  const thisMonthStart = startOfUtcMonth(now);
  const prevMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0)
  );
  return {
    ok: true,
    period: {
      preset: "previous_month",
      start: toIso(prevMonthStart),
      end: toIso(thisMonthStart),
      timezone: "UTC",
    },
  };
}
