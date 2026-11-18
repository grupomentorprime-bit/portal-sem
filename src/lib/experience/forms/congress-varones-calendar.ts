import { QUILICURA_NAZARETH_VENUE } from "@/lib/experience/forms/quilicura-nazareth-venue";

/** 3.° Congreso de Varones — inicio 21 nov 2026 08:00 Chile. */
export const CONGRESS_VARONES_EVENT = {
  title: "3° Congreso de Varones — IPN Chile 2026",
  description:
    "Confirmación de asistencia al 3° Congreso de Varones. Iglesia Pentecostal Nazareth, Quilicura.",
  location: `${QUILICURA_NAZARETH_VENUE.name}, ${QUILICURA_NAZARETH_VENUE.address}`,
  /** Fecha local Chile (sin zona en el string; se interpreta en America/Santiago). */
  start: {
    year: 2026,
    month: 11,
    day: 21,
    hour: 8,
    minute: 0,
  },
  end: {
    year: 2026,
    month: 11,
    day: 22,
    hour: 18,
    minute: 0,
  },
} as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localStamp(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): string {
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}T${pad(parts.hour)}${pad(parts.minute)}00`;
}

/** Enlace a Google Calendar (hora de Chile). */
export function congressVaronesGoogleCalendarUrl(): string {
  const start = localStamp(CONGRESS_VARONES_EVENT.start);
  const end = localStamp(CONGRESS_VARONES_EVENT.end);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: CONGRESS_VARONES_EVENT.title,
    details: CONGRESS_VARONES_EVENT.description,
    location: CONGRESS_VARONES_EVENT.location,
    dates: `${start}/${end}`,
    ctz: "America/Santiago",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Archivo .ics para Apple Calendar, Outlook y la mayoría de teléfonos. */
export function congressVaronesIcsContent(): string {
  const start = localStamp(CONGRESS_VARONES_EVENT.start);
  const end = localStamp(CONGRESS_VARONES_EVENT.end);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const escape = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IPN Chile//Congreso de Varones 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:America/Santiago",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0400",
    "TZNAME:CLT",
    "DTSTART:20260405T000000",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0300",
    "TZNAME:CLST",
    "DTSTART:20260906T000000",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:congreso-varones-2026@ipn-chile`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/Santiago:${start}`,
    `DTEND;TZID=America/Santiago:${end}`,
    `SUMMARY:${escape(CONGRESS_VARONES_EVENT.title)}`,
    `DESCRIPTION:${escape(CONGRESS_VARONES_EVENT.description)}`,
    `LOCATION:${escape(CONGRESS_VARONES_EVENT.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function congressVaronesIcsHref(): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(congressVaronesIcsContent())}`;
}
