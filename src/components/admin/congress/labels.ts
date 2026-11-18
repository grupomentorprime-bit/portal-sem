import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import {
  expectedDaysLabelEs,
  labelExpectedDays,
} from "@/core/congress/expected-days";
import {
  deriveContributionStatus,
  type ContributionStatus,
} from "@/core/congress/finance-status";
import {
  resolveLodgingUiState,
  type LodgingUiState,
} from "@/core/congress/lodging-status";
import { remainingBalanceClp } from "@/core/congress/charges";
import type {
  CongressAttendanceDays,
  CongressLodgingAssignment,
  CongressLodgingNeed,
  CongressRegistration,
} from "@/core/congress/types";

export function formatZoneLabel(zoneId: string): string {
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (match) {
    const n = Number(match[1]);
    return `Zona ${String(n).padStart(2, "0")}`;
  }
  if (/^zona\s+\d+/i.test(zoneId)) {
    return zoneId.replace(/^zona\s*(\d+)/i, (_, digits: string) => {
      return `Zona ${String(Number(digits)).padStart(2, "0")}`;
    });
  }
  return zoneId || "Sin zona";
}

export function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLodgingNightLabel(night: string): string {
  if (night === "2026-11-20") return "Viernes 20";
  if (night === "2026-11-21") return "Sábado 21";
  return night;
}

export function formatMarkedAtSantiago(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTimeSantiago(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function expectedDaysText(days: CongressAttendanceDays | null | undefined): string {
  return expectedDaysLabelEs(labelExpectedDays(days));
}

export function contributionLabel(reg: CongressRegistration): string {
  const status = deriveContributionStatus(reg);
  return contributionStatusLabel(status, reg);
}

export function contributionStatusLabel(
  status: ContributionStatus,
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp">
): string {
  switch (status) {
    case "no_charge":
      return "Sin cargo";
    case "needs_verification":
      return "Pendiente de verificación";
    case "pending":
      return `Pendiente ${formatClp(reg.chargeAmountClp ?? CONGRESS_CONTRIBUTION_CLP)}`;
    case "partial":
      return `Abono · saldo ${formatClp(remainingBalanceClp(reg))}`;
    case "paid":
      return "Pagado";
    default:
      return "—";
  }
}

export function lodgingLabel(state: LodgingUiState): string {
  switch (state.status) {
    case "unknown":
      return "Por confirmar";
    case "none":
      return "No requiere";
    case "unassigned":
      return "Sin asignar";
    case "assigned":
      return "Asignado";
    case "confirmed":
      return "Confirmado";
    default:
      return "—";
  }
}

export function lodgingPendingReasonLabel(reason: string | undefined): string {
  switch (reason) {
    case "unknown":
      return "Desconocido";
    case "unassigned":
      return "Solicitado sin asignar";
    case "unconfirmed":
      return "Asignado sin confirmar";
    default:
      return "";
  }
}

export function resolveRegistrationLodging(
  reg: CongressRegistration,
  assignments: CongressLodgingAssignment[]
): LodgingUiState {
  const active = assignments.find(
    (a) =>
      a.registrationId === reg._id &&
      a.status !== "cancelled" &&
      (a.status === "assigned" || a.status === "confirmed" || a.confirmed)
  );
  return resolveLodgingUiState({
    lodgingNeed: (reg.lodgingNeed ?? "unknown") as CongressLodgingNeed,
    assignment: active ?? null,
  });
}

export function attendanceCellText(
  reg: CongressRegistration,
  day: CongressAttendanceDay
): { text: string; present: boolean; time: string | null } {
  const value = reg.attendance[day];
  const markedAt =
    day === "saturday"
      ? reg.attendanceMeta?.saturdayMarkedAt
      : reg.attendanceMeta?.sundayMarkedAt;
  if (value === true) {
    const time = markedAt ? formatMarkedAtSantiago(markedAt) : null;
    return {
      text: time ? `Presente · ${time}` : "Presente",
      present: true,
      time,
    };
  }
  return { text: "Sin llegada", present: false, time: null };
}

export function journeyDayLabel(day: CongressAttendanceDay): string {
  return day === "saturday" ? "Sábado 21" : "Domingo 22";
}

export function journeyDayShortLabel(day: CongressAttendanceDay): string {
  return day === "saturday" ? "Sáb" : "Dom";
}
