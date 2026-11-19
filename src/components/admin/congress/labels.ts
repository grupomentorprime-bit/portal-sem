import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import {
  displayBrotherName,
  hasBrotherOrTitlePrefix,
} from "@/core/congress/brother-name";
import {
  expectedDaysLabelEs,
  labelExpectedDays,
} from "@/core/congress/expected-days";
import {
  activeChargeConsideration,
  isExplicitlyExempt,
} from "@/core/congress/charge";
import {
  deriveContributionStatus,
  type ContributionStatus,
} from "@/core/congress/finance-status";
import {
  resolveLodgingUiState,
  type LodgingUiState,
} from "@/core/congress/lodging-status";
import { remainingBalanceClp } from "@/core/congress/charges";
import type { CashMethodKey } from "@/core/congress/cash-box";
import type {
  CongressAttendanceDays,
  CongressLodgingAssignment,
  CongressLodgingNeed,
  CongressPaymentMethod,
  CongressRegistration,
} from "@/core/congress/types";

export function registrationDisplayName(
  reg: Pick<CongressRegistration, "identity">
): string {
  return displayBrotherName(reg.identity.fullName);
}

export function registrationNeedsHnoPrefix(
  reg: Pick<CongressRegistration, "identity">
): boolean {
  return !hasBrotherOrTitlePrefix(reg.identity.fullName);
}

export function registrationRoleBadges(
  reg: Pick<CongressRegistration, "isChurchGroupLeader" | "isZoneLeader">
): string[] {
  const badges: string[] = [];
  if (reg.isChurchGroupLeader) badges.push("Líder grupo");
  if (reg.isZoneLeader) badges.push("Jefe zonal");
  return badges;
}

export function paymentMethodLabel(
  method: CashMethodKey | CongressPaymentMethod | null | undefined
): string {
  switch (method) {
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    case "other":
      return "Otro";
    default:
      return "Sin clasificar";
  }
}

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

/** Entero CLP desde texto con `$`, puntos u otros no-dígitos. Vacío → 0. */
export function parseClpInput(text: string): number {
  const digits = text.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/** Texto para input editable; 0/null/undefined → "". */
export function formatClpInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  return formatClp(Math.trunc(value));
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

function considerationSuffix(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "chargeHistory">
): string {
  const note = activeChargeConsideration(reg);
  if (!note) return "";
  return ` · no paga ${formatClp(note.unpaidClp)} · ${note.reason}`;
}

export function contributionStatusLabel(
  status: ContributionStatus,
  reg: Pick<
    CongressRegistration,
    "chargeAmountClp" | "allocatedPaidClp" | "chargeHistory"
  >
): string {
  const suffix = considerationSuffix(reg);
  switch (status) {
    case "no_charge":
      return isExplicitlyExempt(reg) ? `Exento${suffix}` : "Sin cargo";
    case "needs_verification":
      return `Pendiente de verificación${suffix}`;
    case "pending":
      return `Pendiente ${formatClp(reg.chargeAmountClp ?? CONGRESS_CONTRIBUTION_CLP)}${suffix}`;
    case "partial":
      return `Abono · saldo ${formatClp(remainingBalanceClp(reg))}${suffix}`;
    case "paid":
      return `Pagado${suffix}`;
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
