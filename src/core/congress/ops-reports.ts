import { isExplicitlyExempt } from "@/core/congress/charge";
import {
  breakdownPaymentsByPaidOn,
  normalizePaymentMethod,
  reconcilePostedAllocationsWithCollected,
  summarizeCashBox,
  summarizeContributionClose,
  type CashMethodKey,
  type ContributionCloseSummary,
  type PaidOnBreakdownRow,
} from "@/core/congress/cash-box";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import { displayBrotherName, foldCongressPersonName } from "@/core/congress/brother-name";
import {
  foldCongressChurchBase,
  formatCongressChurchLabel,
} from "@/core/congress/church-name";
import { remainingBalanceClp } from "@/core/congress/charges";
import {
  deriveContributionStatus,
  type ContributionStatus,
} from "@/core/congress/finance-status";
import { effectivePaidOn } from "@/core/congress/payment-dates";
import type { CongressPayment, CongressRegistration } from "@/core/congress/types";

export type OpsReportKind =
  | "finance"
  | "cash"
  | "debtors"
  | "roster"
  | "attendance"
  | "directory"
  | "zone-leaders"
  | "church-leaders";

export type OpsReportInput = {
  registrations: CongressRegistration[];
  payments: CongressPayment[];
  churchesByZone?: Record<string, string[]>;
  generatedAtIso: string;
};

export type ReportPerson = {
  id: string;
  name: string;
  phone: string;
  churchKey: string;
  churchLabel: string;
  zoneId: string;
  zoneLabel: string;
  roleLabel: string;
  isZoneLeader: boolean;
  isChurchLeader: boolean;
  saturdayPresent: boolean;
  sundayPresent: boolean;
  chargeClp: number | null;
  paidClp: number;
  balanceClp: number;
  financeStatus: ContributionStatus;
  financeLabel: string;
};

export type ChurchBlock = {
  key: string;
  label: string;
  people: ReportPerson[];
  leaders: ReportPerson[];
  memberCount: number;
  saturdayPresent: number;
  sundayPresent: number;
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
};

export type ZoneBlock = {
  zoneId: string;
  zoneLabel: string;
  people: ReportPerson[];
  churches: ChurchBlock[];
  zoneLeaders: ReportPerson[];
  memberCount: number;
  saturdayPresent: number;
  sundayPresent: number;
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
};

export type FinanceZoneRow = {
  zoneId: string;
  zoneLabel: string;
  count: number;
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
};

export type FinanceChurchRow = FinanceZoneRow & {
  churchLabel: string;
};

export type FinanceReport = {
  kind: "finance";
  generatedAtIso: string;
  close: ContributionCloseSummary;
  reconcile: {
    movementsAllocatedClp: number;
    collectedClp: number;
    deltaClp: number;
  };
  zones: FinanceZoneRow[];
  churches: FinanceChurchRow[];
};

export type CashMovement = {
  id: string;
  folio: string;
  paidOn: string;
  payerName: string;
  churchLabel: string;
  method: CashMethodKey;
  amountClp: number;
  unallocatedClp: number;
  allocations: number;
  voidReason: string;
};

export type CashReport = {
  kind: "cash";
  generatedAtIso: string;
  totalsClp: Record<CashMethodKey, number> & { total: number };
  byDay: PaidOnBreakdownRow[];
  posted: CashMovement[];
  voided: CashMovement[];
};

export type DebtorsReport = {
  kind: "debtors";
  generatedAtIso: string;
  people: number;
  balanceClp: number;
  zones: ZoneBlock[];
};

export type RosterReport = {
  kind: "roster";
  generatedAtIso: string;
  total: number;
  zones: ZoneBlock[];
};

export type AttendanceReport = {
  kind: "attendance";
  generatedAtIso: string;
  total: number;
  saturdayPresent: number;
  sundayPresent: number;
  zones: ZoneBlock[];
};

export type DirectoryReport = {
  kind: "directory";
  generatedAtIso: string;
  churchCount: number;
  zones: ZoneBlock[];
};

export type ZoneLeadersReport = {
  kind: "zone-leaders";
  generatedAtIso: string;
  zones: ZoneBlock[];
};

export type ChurchLeadersReport = {
  kind: "church-leaders";
  generatedAtIso: string;
  zones: ZoneBlock[];
};

export type OpsReport =
  | FinanceReport
  | CashReport
  | DebtorsReport
  | RosterReport
  | AttendanceReport
  | DirectoryReport
  | ZoneLeadersReport
  | ChurchLeadersReport;

const EMPTY_CHURCH = "Sin iglesia";

function compareEs(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export function zoneLabel(zoneId: string): string {
  const known = CONGRESS_ZONES.find((z) => z.id === zoneId);
  if (known) return known.label;
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (match) return `Zona ${String(Number(match[1])).padStart(2, "0")}`;
  return zoneId.trim() || "Sin zona";
}

function zoneOrder(zoneId: string): number {
  const index = CONGRESS_ZONES.findIndex((z) => z.id === zoneId);
  return index === -1 ? 1000 : index;
}

function financeLabel(reg: CongressRegistration, status: ContributionStatus): string {
  switch (status) {
    case "no_charge":
      return isExplicitlyExempt(reg) ? "Exento" : "Sin cargo";
    case "needs_verification":
      return "Por verificar";
    case "pending":
      return "Pendiente";
    case "partial":
      return "Abono";
    case "paid":
      return "Pagado";
    default:
      return "—";
  }
}

function roleLabel(reg: Pick<CongressRegistration, "isZoneLeader" | "isChurchGroupLeader">): string {
  const parts: string[] = [];
  if (reg.isZoneLeader) parts.push("Jefe zonal");
  if (reg.isChurchGroupLeader) parts.push("Líder de iglesia");
  return parts.join(" · ");
}

function churchIdentity(zoneId: string, churchName: string): { key: string; label: string } {
  const base = foldCongressChurchBase(churchName);
  return {
    key: `${zoneId}|${base || "sin-iglesia"}`,
    label: base ? formatCongressChurchLabel(churchName) : EMPTY_CHURCH,
  };
}

export function toReportPerson(reg: CongressRegistration): ReportPerson {
  const zoneId = reg.zoneId?.trim() || "sin-zona";
  const church = churchIdentity(zoneId, reg.churchName);
  const status = deriveContributionStatus(reg);
  return {
    id: reg._id,
    name: displayBrotherName(reg.identity.fullName) || "Sin nombre",
    phone: reg.identity.phone?.trim() || "—",
    churchKey: church.key,
    churchLabel: church.label,
    zoneId,
    zoneLabel: zoneLabel(zoneId),
    roleLabel: roleLabel(reg),
    isZoneLeader: reg.isZoneLeader === true,
    isChurchLeader: reg.isChurchGroupLeader === true,
    saturdayPresent: reg.attendance?.saturday === true,
    sundayPresent: reg.attendance?.sunday === true,
    chargeClp: reg.chargeAmountClp == null ? null : Math.trunc(reg.chargeAmountClp),
    paidClp: Math.max(0, Math.trunc(reg.allocatedPaidClp || 0)),
    balanceClp: remainingBalanceClp(reg),
    financeStatus: status,
    financeLabel: financeLabel(reg, status),
  };
}

export function isOpenContribution(person: ReportPerson): boolean {
  return (
    person.financeStatus === "pending" ||
    person.financeStatus === "partial" ||
    person.financeStatus === "needs_verification"
  );
}

function comparePeople(a: ReportPerson, b: ReportPerson): number {
  return (
    compareEs(foldCongressPersonName(a.name), foldCongressPersonName(b.name)) ||
    compareEs(a.name, b.name)
  );
}

function compareChurches(a: ChurchBlock, b: ChurchBlock): number {
  if (a.label === EMPTY_CHURCH) return 1;
  if (b.label === EMPTY_CHURCH) return -1;
  return compareEs(a.label, b.label);
}

function sumPeople(people: ReportPerson[]) {
  let expectedClp = 0;
  let collectedClp = 0;
  let remainingClp = 0;
  let saturdayPresent = 0;
  let sundayPresent = 0;
  for (const person of people) {
    if (person.chargeClp != null) expectedClp += person.chargeClp;
    collectedClp += person.paidClp;
    remainingClp += person.balanceClp;
    if (person.saturdayPresent) saturdayPresent += 1;
    if (person.sundayPresent) sundayPresent += 1;
  }
  return { expectedClp, collectedClp, remainingClp, saturdayPresent, sundayPresent };
}

function finishChurch(key: string, label: string, people: ReportPerson[]): ChurchBlock {
  const sorted = [...people].sort(comparePeople);
  const totals = sumPeople(sorted);
  return {
    key,
    label,
    people: sorted,
    leaders: sorted.filter((p) => p.isChurchLeader),
    memberCount: sorted.length,
    ...totals,
  };
}

export function buildZoneBlocks(
  registrations: CongressRegistration[],
  churchesByZone: Record<string, string[]> | undefined,
  options: {
    includeEmptyZones: boolean;
    includeCatalogChurches: boolean;
    personFilter?: (person: ReportPerson) => boolean;
  }
): ZoneBlock[] {
  const people = registrations.map(toReportPerson).filter((p) => options.personFilter?.(p) ?? true);
  const zoneIds = new Set<string>(CONGRESS_ZONES.map((z) => z.id));
  for (const person of registrations) {
    const zoneId = person.zoneId?.trim();
    if (zoneId) zoneIds.add(zoneId);
  }
  for (const zoneId of Object.keys(churchesByZone ?? {})) zoneIds.add(zoneId);

  const churches = new Map<string, Map<string, { label: string; people: ReportPerson[] }>>();
  const ensureZone = (zoneId: string) => {
    let zone = churches.get(zoneId);
    if (!zone) {
      zone = new Map();
      churches.set(zoneId, zone);
    }
    return zone;
  };
  const ensureChurch = (zoneId: string, key: string, label: string) => {
    const zone = ensureZone(zoneId);
    const existing = zone.get(key);
    if (existing) return existing;
    const created = { label, people: [] as ReportPerson[] };
    zone.set(key, created);
    return created;
  };

  if (options.includeEmptyZones) {
    for (const zoneId of zoneIds) ensureZone(zoneId);
  }
  if (options.includeCatalogChurches) {
    for (const [zoneId, names] of Object.entries(churchesByZone ?? {})) {
      for (const name of names) {
        const church = churchIdentity(zoneId, name);
        ensureChurch(zoneId, church.key, church.label);
      }
    }
  }
  for (const person of people) {
    ensureChurch(person.zoneId, person.churchKey, person.churchLabel).people.push(person);
  }

  const ordered = [...churches.keys()].sort(
    (a, b) => zoneOrder(a) - zoneOrder(b) || compareEs(zoneLabel(a), zoneLabel(b))
  );

  const zones: ZoneBlock[] = [];
  for (const zoneId of ordered) {
    const churchMap = churches.get(zoneId) ?? new Map();
    let churchBlocks = [...churchMap.entries()].map(([key, value]) =>
      finishChurch(key, value.label, value.people)
    );
    if (!options.includeCatalogChurches) {
      churchBlocks = churchBlocks.filter((c) => c.memberCount > 0);
    }
    churchBlocks.sort(compareChurches);
    const zonePeople = churchBlocks.flatMap((c) => c.people);
    if (!options.includeEmptyZones && zonePeople.length === 0 && churchBlocks.length === 0) {
      continue;
    }
    const zoneLeaders = [...zonePeople.filter((p) => p.isZoneLeader)].sort(comparePeople);
    zones.push({
      zoneId,
      zoneLabel: zoneLabel(zoneId),
      people: zonePeople,
      churches: churchBlocks,
      zoneLeaders,
      memberCount: zonePeople.length,
      ...sumPeople(zonePeople),
    });
  }
  return zones;
}

function toMovement(payment: CongressPayment): CashMovement {
  const churchName = payment.churchName?.trim() ?? "";
  return {
    id: payment._id,
    folio: payment.folio?.trim() || "Sin folio",
    paidOn: effectivePaidOn(payment),
    payerName: payment.payerName?.trim() || "Sin nombre",
    churchLabel: churchName ? formatCongressChurchLabel(churchName) : "—",
    method: normalizePaymentMethod(payment.method),
    amountClp: Math.trunc(payment.amountClp),
    unallocatedClp: Math.max(0, Math.trunc(payment.unallocatedClp || 0)),
    allocations: payment.allocations?.length ?? 0,
    voidReason: payment.voidReason?.trim() || "",
  };
}

function compareMovements(a: CashMovement, b: CashMovement): number {
  return (
    a.paidOn.localeCompare(b.paidOn) ||
    compareEs(a.folio, b.folio) ||
    compareEs(a.payerName, b.payerName)
  );
}

function buildFinance(input: OpsReportInput): FinanceReport {
  const zones = buildZoneBlocks(input.registrations, input.churchesByZone, {
    includeEmptyZones: true,
    includeCatalogChurches: false,
  });
  const churches: FinanceChurchRow[] = zones.flatMap((zone) =>
    zone.churches.map((church) => ({
      zoneId: zone.zoneId,
      zoneLabel: zone.zoneLabel,
      churchLabel: church.label,
      count: church.memberCount,
      expectedClp: church.expectedClp,
      collectedClp: church.collectedClp,
      remainingClp: church.remainingClp,
    }))
  );
  return {
    kind: "finance",
    generatedAtIso: input.generatedAtIso,
    close: summarizeContributionClose(input.registrations),
    reconcile: reconcilePostedAllocationsWithCollected(input.payments, input.registrations),
    zones: zones.map((zone) => ({
      zoneId: zone.zoneId,
      zoneLabel: zone.zoneLabel,
      count: zone.memberCount,
      expectedClp: zone.expectedClp,
      collectedClp: zone.collectedClp,
      remainingClp: zone.remainingClp,
    })),
    churches,
  };
}

function buildCash(input: OpsReportInput): CashReport {
  const postedBox = summarizeCashBox(input.payments, { status: "posted" });
  const voidedBox = summarizeCashBox(input.payments, { status: "voided" });
  return {
    kind: "cash",
    generatedAtIso: input.generatedAtIso,
    totalsClp: postedBox.totalsClp,
    byDay: breakdownPaymentsByPaidOn(input.payments, { status: "posted" }),
    posted: postedBox.rows.map(toMovement).sort(compareMovements),
    voided: voidedBox.rows.map(toMovement).sort(compareMovements),
  };
}

export function buildOpsReport(kind: OpsReportKind, input: OpsReportInput): OpsReport {
  if (kind === "finance") return buildFinance(input);
  if (kind === "cash") return buildCash(input);

  if (kind === "debtors") {
    const zones = buildZoneBlocks(input.registrations, input.churchesByZone, {
      includeEmptyZones: false,
      includeCatalogChurches: false,
      personFilter: isOpenContribution,
    }).map((zone) => ({
      ...zone,
      churches: zone.churches.map((church) => ({
        ...church,
        people: [...church.people].sort(
          (a, b) => b.balanceClp - a.balanceClp || comparePeople(a, b)
        ),
      })),
    }));
    const open = zones.flatMap((z) => z.people);
    return {
      kind: "debtors",
      generatedAtIso: input.generatedAtIso,
      people: open.length,
      balanceClp: open.reduce((sum, p) => sum + p.balanceClp, 0),
      zones,
    };
  }

  if (kind === "roster" || kind === "attendance") {
    const zones = buildZoneBlocks(input.registrations, input.churchesByZone, {
      includeEmptyZones: true,
      includeCatalogChurches: false,
    });
    const total = zones.reduce((sum, z) => sum + z.memberCount, 0);
    if (kind === "roster") {
      return { kind: "roster", generatedAtIso: input.generatedAtIso, total, zones };
    }
    return {
      kind: "attendance",
      generatedAtIso: input.generatedAtIso,
      total,
      saturdayPresent: zones.reduce((sum, z) => sum + z.saturdayPresent, 0),
      sundayPresent: zones.reduce((sum, z) => sum + z.sundayPresent, 0),
      zones,
    };
  }

  const zones = buildZoneBlocks(input.registrations, input.churchesByZone, {
    includeEmptyZones: true,
    includeCatalogChurches: true,
  });
  if (kind === "directory") {
    return {
      kind: "directory",
      generatedAtIso: input.generatedAtIso,
      churchCount: zones.reduce((sum, z) => sum + z.churches.length, 0),
      zones,
    };
  }
  if (kind === "zone-leaders") {
    return { kind: "zone-leaders", generatedAtIso: input.generatedAtIso, zones };
  }
  return { kind: "church-leaders", generatedAtIso: input.generatedAtIso, zones };
}
