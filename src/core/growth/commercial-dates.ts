/**
 * Fechas comerciales de la ficha.
 * Un día elegido en el calendario no es la medianoche UTC: se muestra y vence
 * como ese día en America/Santiago. Un instante real conserva su hora.
 */

const SANTIAGO = "America/Santiago";
const CALENDAR_DAY = /^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?Z)?$/;

export function calendarDueDay(value: string | undefined): string | null {
  if (!value) return null;
  const match = CALENDAR_DAY.exec(value.trim());
  return match?.[1] ?? null;
}

export function santiagoDay(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SANTIAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function dayDistance(fromDay: string, toDay: string): number {
  const [y1, m1, d1] = fromDay.split("-").map(Number);
  const [y2, m2, d2] = toDay.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000
  );
}

export function isCalendarDueOverdue(dueAt: string, now: Date): boolean {
  const day = calendarDueDay(dueAt);
  if (day) return day < santiagoDay(now);
  const parsed = Date.parse(dueAt);
  return !Number.isNaN(parsed) && parsed < now.getTime();
}

export function dueInputValue(dueAt?: string): string {
  if (!dueAt) return "";
  const day = calendarDueDay(dueAt);
  if (day) return day;
  const parsed = Date.parse(dueAt);
  if (Number.isNaN(parsed)) return "";
  return santiagoDay(new Date(parsed));
}

export function formatStageWhen(iso: string): string {
  const day = calendarDueDay(iso);
  if (day) {
    const [year, month, date] = day.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SANTIAGO,
  });
}

/** Relativo y absoluto salen del mismo día. No mezcla «hace N días» con otra fecha. */
export function formatRecordedWhen(iso: string, now: Date = new Date()): string {
  if (calendarDueDay(iso)) return formatStageWhen(iso);
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  const absolute = formatStageWhen(iso);
  const then = santiagoDay(new Date(parsed));
  const today = santiagoDay(now);
  const diff = dayDistance(then, today);
  if (diff < 0) return absolute;
  const relative = diff === 0 ? "Hoy" : diff === 1 ? "Ayer" : `Hace ${diff} días`;
  return `${relative} · ${absolute}`;
}
