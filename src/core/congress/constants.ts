import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";

/** Evento operativo del 3.° Congreso Nacional de Varones (Quilicura). */
export const CONGRESS_EVENT_ID = "ipn-congreso-varones-2026";

export const CONGRESS_FORM_ID = CONGRESS_VARONES_FORM_ID;

/**
 * Aporte fijo de alimentación por participante identificado (CLP).
 * Cubre ambos días del congreso; no depende del día de llegada ni de los días previstos.
 */
export const CONGRESS_CONTRIBUTION_CLP = 17_000;

/** Noches configurables de alojamiento (ISO date). */
export const CONGRESS_NIGHTS = ["2026-11-20", "2026-11-21"] as const;

export type CongressNight = (typeof CONGRESS_NIGHTS)[number];

export const CONGRESS_ATTENDANCE_DAYS = ["saturday", "sunday"] as const;

export type CongressAttendanceDay = (typeof CONGRESS_ATTENDANCE_DAYS)[number];

/** Zonas operativas precargadas (01–11). IDs canónicos: zona-1 … zona-11. */
export const CONGRESS_ZONE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export const CONGRESS_ZONES = CONGRESS_ZONE_NUMBERS.map((n) => ({
  id: `zona-${n}`,
  label: `Zona ${String(n).padStart(2, "0")}`,
}));

export const CONGRESS_COLLECTIONS = {
  registrations: "congress_registrations",
  payments: "congress_payments",
  homes: "congress_lodging_homes",
  assignments: "congress_lodging_assignments",
  churchRequests: "congress_lodging_church_requests",
  churches: "congress_churches",
  importBatches: "congress_import_batches",
  audit: "congress_audit",
  events: "congress_events",
} as const;
