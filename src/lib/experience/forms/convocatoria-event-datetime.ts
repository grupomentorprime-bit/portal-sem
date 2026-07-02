const CHILE_EVENT_OFFSET = "-04:00";

export const DEFAULT_CHILE_EVENT_TIME = "09:00";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Normaliza HH:mm (24 h) para inputs type="time". */
export function normalizeChileEventTime(time?: string): string {
  const trimmed = (time ?? DEFAULT_CHILE_EVENT_TIME).trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return DEFAULT_CHILE_EVENT_TIME;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return DEFAULT_CHILE_EVENT_TIME;
  }

  return `${pad2(hours)}:${pad2(minutes)}`;
}

/** Valor YYYY-MM-DD para inputs type="date" a partir del contador CMS. */
export function counterDateInputValue(targetDate?: string): string {
  if (!targetDate?.trim()) return "";
  return targetDate.trim().slice(0, 10);
}

/** Fecha/hora canónica de inicio de jornada convocatoria en Chile. */
export function buildChileEventStartIso(
  eventDate: string,
  time: string = DEFAULT_CHILE_EVENT_TIME
): string {
  const dateOnly = eventDate.trim().slice(0, 10);
  const normalizedTime = normalizeChileEventTime(time);
  const [hours, minutes] = normalizedTime.split(":").map(Number);
  return `${dateOnly}T${pad2(hours)}:${pad2(minutes)}:00${CHILE_EVENT_OFFSET}`;
}

/** Normaliza fechas guardadas en CMS (solo día o medianoche UTC) al inicio real del evento. */
export function resolveChileEventStartMs(
  targetDate: string,
  fallbackEventDate?: string,
  targetTime?: string
): number {
  const trimmed = targetDate.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : trimmed.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return Number.NaN;
  }

  const canonical = buildChileEventStartIso(
    fallbackEventDate ?? dateOnly,
    targetTime ?? DEFAULT_CHILE_EVENT_TIME
  );

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(buildChileEventStartIso(dateOnly, targetTime)).getTime();
  }

  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) {
    return new Date(canonical).getTime();
  }

  const isMidnightUtc =
    trimmed.endsWith("Z") &&
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0;

  const isDateOnlyInput = trimmed.length === 10;

  if (isMidnightUtc || isDateOnlyInput) {
    return new Date(buildChileEventStartIso(dateOnly, targetTime)).getTime();
  }

  return parsed.getTime();
}

/** Días de calendario en Chile entre hoy y la fecha del evento (sin contar la hora). */
export function chileCalendarDaysUntil(targetMs: number, nowMs = Date.now()): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const toUtcDay = (ms: number) => {
    const [year, month, day] = fmt.format(new Date(ms)).split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const diff = Math.round((toUtcDay(targetMs) - toUtcDay(nowMs)) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatChileEventDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(timestamp));
}

export function formatChileNowDateTime(date = new Date()): string {
  return formatChileEventDateTime(date.getTime());
}

/** Etiqueta legible para tarjeta Fecha: «Sábado 4 de julio de 2026». */
export function formatConvocatoriaFechaLabel(eventDate: string): string {
  const dateOnly = eventDate.trim().slice(0, 10);
  const parsed = new Date(`${dateOnly}T12:00:00${CHILE_EVENT_OFFSET}`);
  if (!Number.isFinite(parsed.getTime())) return dateOnly;

  const formatted = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(parsed);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Etiqueta legible para tarjeta Horario: «Desde las 9:00 am — incluye evaluación académica». */
export function formatConvocatoriaHorarioLabel(
  time: string = DEFAULT_CHILE_EVENT_TIME,
  includeEvaluationNote = true
): string {
  const normalized = normalizeChileEventTime(time);
  const [hours, minutes] = normalized.split(":").map(Number);
  const anchor = new Date(`2026-01-01T${pad2(hours)}:${pad2(minutes)}:00${CHILE_EVENT_OFFSET}`);
  const formatted = new Intl.DateTimeFormat("es-CL", {
    hour: "numeric",
    minute: minutes > 0 ? "2-digit" : undefined,
    hour12: true,
    timeZone: "America/Santiago",
  }).format(anchor);

  const base = `Desde las ${formatted}`;
  return includeEvaluationNote ? `${base} — incluye evaluación académica` : base;
}
