import { displayBrotherName } from "@/core/congress/brother-name";
import { CONGRESS_NIGHTS, type CongressNight } from "@/core/congress/constants";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";

export type LodgingHomesReportGuest = {
  registrationId: string;
  fullName: string;
  churchZoneLabel: string;
  phone: string;
  nights: CongressNight[];
  nightsLabel: string;
};

export type LodgingHomesReportHome = {
  homeId: string;
  homeNumber: number;
  name: string;
  /** Nombre de contacto de la familia (si existe). */
  hostName: string;
  /** Teléfono de la familia anfitriona. */
  hostPhone: string;
  address: string | null;
  notes: string | null;
  guestCount: number;
  bedsFriday: number;
  bedsSaturday: number;
  guests: LodgingHomesReportGuest[];
};

function hostContactFromHome(h: CongressLodgingHome): {
  hostName: string;
  hostPhone: string;
} {
  const phone = h.contactPhone?.trim() || "";
  const name = h.contactName?.trim() || "";
  return {
    hostName: name || "Sin registrar",
    hostPhone: phone || "—",
  };
}

export type LodgingHomesReport = {
  generatedAtIso: string;
  homes: LodgingHomesReportHome[];
};

/** Número estable 1…N de cada hogar, por nombre de familia. El mismo en todos los informes. */
export function lodgingHomeNumberById(homes: readonly CongressLodgingHome[]): Map<string, number> {
  const ordered = [...homes].sort(
    (a, b) => a.name.localeCompare(b.name, "es") || a._id.localeCompare(b._id)
  );
  const numbers = new Map<string, number>();
  ordered.forEach((home, index) => numbers.set(home._id, index + 1));
  return numbers;
}

export function isActiveLodgingAssignment(a: CongressLodgingAssignment): boolean {
  if (a.status === "cancelled") return false;
  return a.status === "assigned" || a.status === "confirmed" || Boolean(a.confirmed);
}

export function labelLodgingNights(nights: readonly CongressNight[]): string {
  const set = new Set(nights);
  const fri = set.has(CONGRESS_NIGHTS[0]);
  const sat = set.has(CONGRESS_NIGHTS[1]);
  if (fri && sat) return "Ambos (vie 20 y sáb 21)";
  if (fri) return "Viernes 20";
  if (sat) return "Sábado 21";
  return "—";
}

function formatZoneLabel(zoneId: string): string {
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (match) return `Zona ${String(Number(match[1])).padStart(2, "0")}`;
  return zoneId;
}

export function buildLodgingHomesReport(input: {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  generatedAtIso: string;
}): LodgingHomesReport {
  const regById = new Map(input.registrations.map((r) => [r._id, r]));
  const homeById = new Map(input.homes.map((h) => [h._id, h]));
  const homeNumbers = lodgingHomeNumberById(input.homes);

  type Acc = {
    nights: Set<CongressNight>;
  };
  const byHome = new Map<string, Map<string, Acc>>();

  for (const a of input.assignments) {
    if (!isActiveLodgingAssignment(a)) continue;
    if (!homeById.has(a.homeId)) continue;
    if (!regById.has(a.registrationId)) continue;
    let people = byHome.get(a.homeId);
    if (!people) {
      people = new Map();
      byHome.set(a.homeId, people);
    }
    let acc = people.get(a.registrationId);
    if (!acc) {
      acc = { nights: new Set() };
      people.set(a.registrationId, acc);
    }
    acc.nights.add(a.night);
  }

  const homesOut: LodgingHomesReportHome[] = [];
  for (const [homeId, people] of byHome) {
    const h = homeById.get(homeId);
    if (!h || people.size === 0) continue;

    const guests: LodgingHomesReportGuest[] = [];
    let bedsFriday = 0;
    let bedsSaturday = 0;
    for (const [registrationId, acc] of people) {
      const r = regById.get(registrationId)!;
      const nights = CONGRESS_NIGHTS.filter((n) => acc.nights.has(n));
      if (acc.nights.has(CONGRESS_NIGHTS[0])) bedsFriday += 1;
      if (acc.nights.has(CONGRESS_NIGHTS[1])) bedsSaturday += 1;
      guests.push({
        registrationId,
        fullName: displayBrotherName(r.identity.fullName),
        churchZoneLabel: `${r.churchName} · ${formatZoneLabel(r.zoneId)}`,
        phone: r.identity.phone?.trim() ? r.identity.phone.trim() : "—",
        nights,
        nightsLabel: labelLodgingNights(nights),
      });
    }
    guests.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

    const host = hostContactFromHome(h);
    homesOut.push({
      homeId,
      homeNumber: homeNumbers.get(homeId) ?? 0,
      name: h.name,
      hostName: host.hostName,
      hostPhone: host.hostPhone,
      address: h.address?.trim() ? h.address.trim() : null,
      notes: h.notes?.trim() ? h.notes.trim() : null,
      guestCount: guests.length,
      bedsFriday,
      bedsSaturday,
      guests,
    });
  }

  homesOut.sort((a, b) => a.homeNumber - b.homeNumber || a.name.localeCompare(b.name, "es"));

  return { generatedAtIso: input.generatedAtIso, homes: homesOut };
}
