import type { CongressNight } from "@/core/congress/constants";
import { CONGRESS_NIGHTS } from "@/core/congress/constants";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";

export function isCongressNight(value: string): value is CongressNight {
  return (CONGRESS_NIGHTS as readonly string[]).includes(value);
}

export function emptyCapacityByNight(): Record<CongressNight, number> {
  return {
    "2026-11-20": 0,
    "2026-11-21": 0,
  };
}

export function occupiedBedsForNight(
  assignments: Array<{ night: string; homeId: string; status?: string }>,
  homeId: string,
  night: CongressNight
): number {
  return assignments.filter(
    (a) =>
      a.homeId === homeId &&
      a.night === night &&
      (a.status == null || a.status === "assigned" || a.status === "confirmed")
  ).length;
}

export function canAssignBed(input: {
  capacity: number;
  occupied: number;
}): boolean {
  const capacity = Math.max(0, Math.trunc(input.capacity));
  const occupied = Math.max(0, Math.trunc(input.occupied));
  return occupied < capacity;
}

/**
 * Las cantidades del Excel son solicitudes de iglesia, no camas asignadas.
 * No inventan cupos de hogar ni se suman con asignaciones individuales.
 */
export function churchRequestIsAssignment(): false {
  return false;
}

export type LodgingDemandVsAssigned = {
  requestedBeds: number;
  assignedBeds: number;
  /** Demanda de iglesia pendiente de cubrir con asignaciones individuales. */
  unmetRequestBeds: number;
};

export function summarizeLodgingDemand(input: {
  requestedBeds: number;
  assignedBeds: number;
}): LodgingDemandVsAssigned {
  const requestedBeds = Math.max(0, Math.trunc(input.requestedBeds));
  const assignedBeds = Math.max(0, Math.trunc(input.assignedBeds));
  return {
    requestedBeds,
    assignedBeds,
    unmetRequestBeds: Math.max(0, requestedBeds - assignedBeds),
  };
}

/**
 * Intento de asignación concurrente: ambos operadores ven occupied=capacity-1.
 * Solo uno puede ganar si se usa compare-and-set sobre occupied/version.
 */
export function resolveLastBedRace(input: {
  capacity: number;
  occupiedBefore: number;
  winners: number;
}): { accepted: number; rejected: number } {
  const free = Math.max(0, input.capacity - input.occupiedBefore);
  const accepted = Math.min(free, Math.max(0, input.winners));
  return { accepted, rejected: Math.max(0, input.winners - accepted) };
}

export type CongressLodgingAssignmentStatus = "assigned" | "confirmed" | "cancelled";

export function isActiveLodgingAssignment(assignment: {
  status?: CongressLodgingAssignmentStatus | string | null;
}): boolean {
  if (assignment.status == null) return true;
  return assignment.status === "assigned" || assignment.status === "confirmed";
}

export function activeAssignmentStatuses(): CongressLodgingAssignmentStatus[] {
  return ["assigned", "confirmed"];
}

/** Vacío queda vacío. Con texto, solo se guarda un teléfono de Chile. */
export function lodgingContactPhoneForSave(
  value: string | null | undefined
): { ok: true; phone: string | null } | { ok: false; error: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: true, phone: null };
  const phone = normalizeChilePhone(trimmed);
  if (!phone) return { ok: false, error: CHILE_PHONE_INVALID_MESSAGE };
  return { ok: true, phone };
}
