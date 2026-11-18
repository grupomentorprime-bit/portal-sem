import { remainingBalanceClp } from "@/core/congress/charges";
import {
  deriveContributionStatus,
  type ContributionStatus,
} from "@/core/congress/finance-status";
import { effectivePaidOn } from "@/core/congress/payment-dates";
import type {
  CongressPayment,
  CongressPaymentMethod,
  CongressRegistration,
} from "@/core/congress/types";

export type CashMethodKey = CongressPaymentMethod | "unclassified";

export type CashBoxFilters = {
  method?: CashMethodKey | "all";
  fromPaidOn?: string;
  toPaidOn?: string;
  status?: "posted" | "voided" | "all";
};

export type ContributionCloseSummary = {
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
  countsByStatus: Record<ContributionStatus, number>;
};

export type PaidOnBreakdownRow = {
  paidOn: string;
  totalClp: number;
  count: number;
};

export type ContributionGroupRow = {
  key: string;
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
  count: number;
};

export function normalizePaymentMethod(
  method?: CongressPaymentMethod | null
): CashMethodKey {
  if (method === "cash" || method === "transfer" || method === "other") return method;
  return "unclassified";
}

export function summarizeCashBox(
  payments: CongressPayment[],
  filters: CashBoxFilters = {}
): {
  rows: CongressPayment[];
  totalsClp: Record<CashMethodKey, number> & { total: number };
} {
  const statusFilter = filters.status ?? "posted";
  const methodFilter = filters.method ?? "all";

  const rows = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const key = normalizePaymentMethod(p.method);
    if (methodFilter !== "all" && key !== methodFilter) return false;
    const day = effectivePaidOn(p);
    if (filters.fromPaidOn && day < filters.fromPaidOn) return false;
    if (filters.toPaidOn && day > filters.toPaidOn) return false;
    return true;
  });

  const totalsClp: Record<CashMethodKey, number> & { total: number } = {
    cash: 0,
    transfer: 0,
    other: 0,
    unclassified: 0,
    total: 0,
  };

  for (const p of rows) {
    if (p.status !== "posted") continue;
    const key = normalizePaymentMethod(p.method);
    const amount = Math.trunc(p.amountClp);
    totalsClp[key] += amount;
    totalsClp.total += amount;
  }

  return { rows, totalsClp };
}

/**
 * Cuadre universo: suma imputada en movimientos posted vs cobrado en fichas.
 * deltaClp = movimientosAllocatedClp - collectedClp (0 = cuadra).
 */
export function reconcilePostedAllocationsWithCollected(
  payments: Array<Pick<CongressPayment, "status" | "amountClp" | "unallocatedClp">>,
  registrations: Array<
    Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
  >
): {
  movementsAllocatedClp: number;
  collectedClp: number;
  deltaClp: number;
} {
  let movementsAllocatedClp = 0;
  for (const p of payments) {
    if (p.status !== "posted") continue;
    const amount = Math.trunc(p.amountClp);
    const unalloc = Math.max(0, Math.trunc(p.unallocatedClp));
    movementsAllocatedClp += Math.max(0, amount - unalloc);
  }
  const { collectedClp } = summarizeContributionClose(registrations);
  return {
    movementsAllocatedClp,
    collectedClp,
    deltaClp: movementsAllocatedClp - collectedClp,
  };
}

export function summarizeContributionClose(
  registrations: Array<
    Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
  >
): ContributionCloseSummary {
  const countsByStatus: Record<ContributionStatus, number> = {
    no_charge: 0,
    needs_verification: 0,
    pending: 0,
    partial: 0,
    paid: 0,
  };
  let expectedClp = 0;
  let collectedClp = 0;
  let remainingClp = 0;
  for (const reg of registrations) {
    countsByStatus[deriveContributionStatus(reg)] += 1;
    if (reg.chargeAmountClp == null) continue;
    expectedClp += Math.trunc(reg.chargeAmountClp);
    collectedClp += Math.max(0, Math.trunc(reg.allocatedPaidClp));
    remainingClp += remainingBalanceClp(reg);
  }
  return { expectedClp, collectedClp, remainingClp, countsByStatus };
}

export function breakdownPaymentsByPaidOn(
  payments: CongressPayment[],
  filters: CashBoxFilters = {}
): PaidOnBreakdownRow[] {
  const { rows } = summarizeCashBox(payments, {
    ...filters,
    status: filters.status ?? "all",
  });
  const map = new Map<string, PaidOnBreakdownRow>();
  for (const p of rows) {
    if (p.status !== "posted") continue;
    const paidOn = effectivePaidOn(p);
    const cur = map.get(paidOn) ?? { paidOn, totalClp: 0, count: 0 };
    cur.totalClp += Math.trunc(p.amountClp);
    cur.count += 1;
    map.set(paidOn, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.paidOn.localeCompare(b.paidOn));
}

function groupContributions(
  registrations: Array<
    Pick<
      CongressRegistration,
      "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    > & { key: string }
  >
): ContributionGroupRow[] {
  const map = new Map<string, ContributionGroupRow>();
  for (const reg of registrations) {
    const cur = map.get(reg.key) ?? {
      key: reg.key,
      expectedClp: 0,
      collectedClp: 0,
      remainingClp: 0,
      count: 0,
    };
    cur.count += 1;
    if (reg.chargeAmountClp != null) {
      cur.expectedClp += Math.trunc(reg.chargeAmountClp);
      cur.collectedClp += Math.max(0, Math.trunc(reg.allocatedPaidClp));
      cur.remainingClp += remainingBalanceClp(reg);
    }
    map.set(reg.key, cur);
  }
  return Array.from(map.values());
}

export function breakdownContributionsByZone(
  registrations: Array<
    Pick<
      CongressRegistration,
      "zoneId" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    >
  >
): ContributionGroupRow[] {
  return groupContributions(
    registrations.map((r) => ({ ...r, key: r.zoneId }))
  ).sort((a, b) => a.key.localeCompare(b.key));
}

export function breakdownContributionsByChurch(
  registrations: Array<
    Pick<
      CongressRegistration,
      "churchName" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    >
  >
): ContributionGroupRow[] {
  return groupContributions(
    registrations.map((r) => ({ ...r, key: r.churchName }))
  ).sort((a, b) => b.remainingClp - a.remainingClp || a.key.localeCompare(b.key));
}
