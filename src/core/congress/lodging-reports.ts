import { displayBrotherName } from "@/core/congress/brother-name";
import { CONGRESS_NIGHTS, type CongressNight } from "@/core/congress/constants";
import {
  buildLodgingHomesReport,
  isActiveLodgingAssignment,
  labelLodgingNights,
  lodgingHomeNumberById,
  type LodgingHomesReport,
  type LodgingHomesReportGuest,
} from "@/core/congress/lodging-homes-report";
import {
  isLodgingPending,
  resolveLodgingUiState,
  type LodgingPendingReason,
} from "@/core/congress/lodging-status";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";

export type LodgingReportKind = "briefing" | "homes" | "capacity" | "pending";

export type LodgingReportInput = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  generatedAtIso: string;
};

export type LodgingHomesCatalogReport = LodgingHomesReport & { kind: "homes" };

export type LodgingCapacityHome = {
  homeId: string;
  homeNumber: number;
  name: string;
  hostName: string;
  hostPhone: string;
  address: string | null;
  fridayCapacity: number;
  fridayUsed: number;
  fridayFree: number;
  saturdayCapacity: number;
  saturdayUsed: number;
  saturdayFree: number;
};

export type LodgingCapacityReport = {
  kind: "capacity";
  generatedAtIso: string;
  homeCount: number;
  fridayCapacity: number;
  fridayUsed: number;
  fridayFree: number;
  saturdayCapacity: number;
  saturdayUsed: number;
  saturdayFree: number;
  homes: LodgingCapacityHome[];
};

export type LodgingPendingPerson = {
  registrationId: string;
  fullName: string;
  churchZoneLabel: string;
  phone: string;
  statusLabel: string;
  detail: string;
  zoneOrder: number;
};

export type LodgingPendingReport = {
  kind: "pending";
  generatedAtIso: string;
  people: LodgingPendingPerson[];
};

export type LodgingBriefingHome = {
  homeId: string;
  homeNumber: number;
  name: string;
  hostPhone: string;
  address: string | null;
  notes: string | null;
  fridayCapacity: number;
  fridayUsed: number;
  fridayFree: number;
  saturdayCapacity: number;
  saturdayUsed: number;
  saturdayFree: number;
  guestCount: number;
  guests: LodgingHomesReportGuest[];
};

export type LodgingBriefingReport = {
  kind: "briefing";
  generatedAtIso: string;
  homeCount: number;
  guestCount: number;
  fridayCapacity: number;
  fridayUsed: number;
  fridayFree: number;
  saturdayCapacity: number;
  saturdayUsed: number;
  saturdayFree: number;
  pendingCount: number;
  homes: LodgingBriefingHome[];
  pending: LodgingPendingPerson[];
};

export type LodgingCatalogReport =
  | LodgingBriefingReport
  | LodgingHomesCatalogReport
  | LodgingCapacityReport
  | LodgingPendingReport;

const FRIDAY: CongressNight = CONGRESS_NIGHTS[0];
const SATURDAY: CongressNight = CONGRESS_NIGHTS[1];

function formatZoneLabel(zoneId: string): string {
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (match) return `Zona ${String(Number(match[1])).padStart(2, "0")}`;
  return zoneId || "Sin zona";
}

function zoneOrder(zoneId: string): number {
  const match = zoneId.trim().match(/(\d+)/);
  return match ? Number(match[1]) : 999;
}

function hostContact(home: CongressLodgingHome): { hostName: string; hostPhone: string } {
  return {
    hostName: home.contactName?.trim() || "Sin registrar",
    hostPhone: home.contactPhone?.trim() || "—",
  };
}

function usedOn(homeId: string, night: CongressNight, assignments: CongressLodgingAssignment[]): number {
  return assignments.filter(
    (a) => a.homeId === homeId && a.night === night && isActiveLodgingAssignment(a)
  ).length;
}

export function buildLodgingCapacityReport(input: LodgingReportInput): LodgingCapacityReport {
  const numbers = lodgingHomeNumberById(input.homes);
  const homes = [...input.homes]
    .sort((a, b) => (numbers.get(a._id) ?? 0) - (numbers.get(b._id) ?? 0))
    .map((home) => {
      const host = hostContact(home);
      const fridayCapacity = home.capacityByNight[FRIDAY] ?? 0;
      const saturdayCapacity = home.capacityByNight[SATURDAY] ?? 0;
      const fridayUsed = usedOn(home._id, FRIDAY, input.assignments);
      const saturdayUsed = usedOn(home._id, SATURDAY, input.assignments);
      return {
        homeId: home._id,
        homeNumber: numbers.get(home._id) ?? 0,
        name: home.name,
        hostName: host.hostName,
        hostPhone: host.hostPhone,
        address: home.address?.trim() ? home.address.trim() : null,
        fridayCapacity,
        fridayUsed,
        fridayFree: fridayCapacity - fridayUsed,
        saturdayCapacity,
        saturdayUsed,
        saturdayFree: saturdayCapacity - saturdayUsed,
      };
    });

  const sum = (pick: (row: LodgingCapacityHome) => number) =>
    homes.reduce((total, row) => total + pick(row), 0);

  return {
    kind: "capacity",
    generatedAtIso: input.generatedAtIso,
    homeCount: homes.length,
    fridayCapacity: sum((row) => row.fridayCapacity),
    fridayUsed: sum((row) => row.fridayUsed),
    fridayFree: sum((row) => row.fridayFree),
    saturdayCapacity: sum((row) => row.saturdayCapacity),
    saturdayUsed: sum((row) => row.saturdayUsed),
    saturdayFree: sum((row) => row.saturdayFree),
    homes,
  };
}

function placementDetail(
  registrationId: string,
  homes: CongressLodgingHome[],
  assignments: CongressLodgingAssignment[],
  numbers: Map<string, number>
): string {
  const homeById = new Map(homes.map((home) => [home._id, home]));
  const byHome = new Map<string, Set<CongressNight>>();
  for (const assignment of assignments) {
    if (assignment.registrationId !== registrationId) continue;
    if (!isActiveLodgingAssignment(assignment)) continue;
    let nights = byHome.get(assignment.homeId);
    if (!nights) {
      nights = new Set();
      byHome.set(assignment.homeId, nights);
    }
    nights.add(assignment.night);
  }
  if (byHome.size === 0) return "Asignado, falta confirmar";

  const parts = [...byHome.entries()].map(([homeId, nights]) => {
    const home = homeById.get(homeId);
    const name = home?.name?.trim() || "Hogar no encontrado";
    const number = numbers.get(homeId);
    const ordered = CONGRESS_NIGHTS.filter((night) => nights.has(night));
    const where = number ? `Hogar N° ${number} · ${name}` : name;
    return {
      homeNumber: number ?? 999,
      label: `${where} · ${labelLodgingNights(ordered)}`,
    };
  });
  parts.sort((a, b) => a.homeNumber - b.homeNumber || a.label.localeCompare(b.label, "es"));
  return `Asignado, falta confirmar · ${parts.map((part) => part.label).join("; ")}`;
}

function pendingCopy(
  reason: LodgingPendingReason | undefined,
  registrationId: string,
  homes: CongressLodgingHome[],
  assignments: CongressLodgingAssignment[],
  numbers: Map<string, number>
): { statusLabel: string; detail: string } {
  if (reason === "unconfirmed") {
    return {
      statusLabel: "Asignado",
      detail: placementDetail(registrationId, homes, assignments, numbers),
    };
  }
  if (reason === "unassigned") {
    return { statusLabel: "Sin asignar", detail: "Pidió cama y aún no tiene hogar" };
  }
  return { statusLabel: "Por confirmar", detail: "Necesidad de alojamiento por confirmar" };
}

export function buildLodgingPendingReport(input: LodgingReportInput): LodgingPendingReport {
  const numbers = lodgingHomeNumberById(input.homes);
  const people: LodgingPendingPerson[] = [];
  for (const registration of input.registrations) {
    const active = input.assignments.find(
      (assignment) =>
        assignment.registrationId === registration._id && isActiveLodgingAssignment(assignment)
    );
    const state = resolveLodgingUiState({
      lodgingNeed: registration.lodgingNeed ?? "unknown",
      assignment: active ?? null,
    });
    if (!isLodgingPending(state)) continue;
    const copy = pendingCopy(
      state.pendingReason,
      registration._id,
      input.homes,
      input.assignments,
      numbers
    );
    people.push({
      registrationId: registration._id,
      fullName: displayBrotherName(registration.identity.fullName),
      churchZoneLabel: `${registration.churchName} · ${formatZoneLabel(registration.zoneId)}`,
      phone: registration.identity.phone?.trim() || "—",
      statusLabel: copy.statusLabel,
      detail: copy.detail,
      zoneOrder: zoneOrder(registration.zoneId),
    });
  }

  people.sort((a, b) => {
    if (a.zoneOrder !== b.zoneOrder) return a.zoneOrder - b.zoneOrder;
    const byChurch = a.churchZoneLabel.localeCompare(b.churchZoneLabel, "es");
    if (byChurch !== 0) return byChurch;
    return a.fullName.localeCompare(b.fullName, "es");
  });

  return { kind: "pending", generatedAtIso: input.generatedAtIso, people };
}

export function buildLodgingBriefingReport(input: LodgingReportInput): LodgingBriefingReport {
  const numbers = lodgingHomeNumberById(input.homes);
  const occupied = new Map(buildLodgingHomesReport(input).homes.map((home) => [home.homeId, home]));
  const pending = buildLodgingPendingReport(input);
  const homes: LodgingBriefingHome[] = [...input.homes]
    .sort((a, b) => (numbers.get(a._id) ?? 0) - (numbers.get(b._id) ?? 0))
    .map((home) => {
      const detail = occupied.get(home._id);
      const host = hostContact(home);
      const fridayCapacity = home.capacityByNight[FRIDAY] ?? 0;
      const saturdayCapacity = home.capacityByNight[SATURDAY] ?? 0;
      const fridayUsed = usedOn(home._id, FRIDAY, input.assignments);
      const saturdayUsed = usedOn(home._id, SATURDAY, input.assignments);
      return {
        homeId: home._id,
        homeNumber: numbers.get(home._id) ?? 0,
        name: home.name,
        hostPhone: host.hostPhone,
        address: home.address?.trim() ? home.address.trim() : null,
        notes: home.notes?.trim() ? home.notes.trim() : null,
        fridayCapacity,
        fridayUsed,
        fridayFree: fridayCapacity - fridayUsed,
        saturdayCapacity,
        saturdayUsed,
        saturdayFree: saturdayCapacity - saturdayUsed,
        guestCount: detail?.guestCount ?? 0,
        guests: detail?.guests ?? [],
      };
    });

  const sum = (pick: (row: LodgingBriefingHome) => number) =>
    homes.reduce((total, row) => total + pick(row), 0);

  return {
    kind: "briefing",
    generatedAtIso: input.generatedAtIso,
    homeCount: homes.length,
    guestCount: sum((row) => row.guestCount),
    fridayCapacity: sum((row) => row.fridayCapacity),
    fridayUsed: sum((row) => row.fridayUsed),
    fridayFree: sum((row) => row.fridayFree),
    saturdayCapacity: sum((row) => row.saturdayCapacity),
    saturdayUsed: sum((row) => row.saturdayUsed),
    saturdayFree: sum((row) => row.saturdayFree),
    pendingCount: pending.people.length,
    homes,
    pending: pending.people,
  };
}

export function buildLodgingCatalogReport(
  kind: LodgingReportKind,
  input: LodgingReportInput
): LodgingCatalogReport {
  if (kind === "briefing") return buildLodgingBriefingReport(input);
  if (kind === "homes") {
    return { kind: "homes", ...buildLodgingHomesReport(input) };
  }
  if (kind === "capacity") return buildLodgingCapacityReport(input);
  return buildLodgingPendingReport(input);
}
