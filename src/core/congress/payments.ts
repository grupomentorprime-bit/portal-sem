import { remainingBalanceClp } from "@/core/congress/charges";
import { isValidPaidOn } from "@/core/congress/payment-dates";
import type {
  CongressPayment,
  CongressPaymentAllocation,
  CongressPaymentMethod,
  CongressRegistration,
} from "@/core/congress/types";

export type AllocatePaymentInput = {
  paymentId: string;
  tenantId: string;
  eventId: string;
  payerType: CongressPayment["payerType"];
  payerName: string;
  churchName?: string | null;
  amountClp: number;
  method: CongressPaymentMethod;
  paidOn: string;
  receiptRef?: string | null;
  note?: string | null;
  allocations: CongressPaymentAllocation[];
  createdByUserId: string;
  createdAt: string;
  /** Estado actual de las fichas a imputar (por id). */
  registrations: CongressRegistration[];
};

export type AllocatePaymentOk = {
  ok: true;
  payment: CongressPayment;
  updatedRegistrations: CongressRegistration[];
};

export type AllocatePaymentErr = {
  ok: false;
  error:
    | "invalid_amount"
    | "empty_payer"
    | "invalid_method"
    | "invalid_paid_on"
    | "allocation_exceeds_payment"
    | "unknown_registration"
    | "no_charge"
    | "allocation_exceeds_balance"
    | "duplicate_registration_in_allocations"
    | "non_positive_allocation";
};

export type AllocatePaymentResult = AllocatePaymentOk | AllocatePaymentErr;

const PAYMENT_METHODS = new Set<CongressPaymentMethod>(["cash", "transfer", "other"]);

export function allocatePayment(input: AllocatePaymentInput): AllocatePaymentResult {
  if (!PAYMENT_METHODS.has(input.method)) {
    return { ok: false, error: "invalid_method" };
  }
  if (!isValidPaidOn(input.paidOn)) {
    return { ok: false, error: "invalid_paid_on" };
  }

  const amountClp = Math.trunc(input.amountClp);
  if (!Number.isFinite(amountClp) || amountClp <= 0) {
    return { ok: false, error: "invalid_amount" };
  }
  if (!input.payerName.trim()) {
    return { ok: false, error: "empty_payer" };
  }

  const seen = new Set<string>();
  let allocatedSum = 0;
  for (const row of input.allocations) {
    const amount = Math.trunc(row.amountClp);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "non_positive_allocation" };
    }
    if (seen.has(row.registrationId)) {
      return { ok: false, error: "duplicate_registration_in_allocations" };
    }
    seen.add(row.registrationId);
    allocatedSum += amount;
  }

  if (allocatedSum > amountClp) {
    return { ok: false, error: "allocation_exceeds_payment" };
  }

  const byId = new Map(input.registrations.map((r) => [r._id, r]));
  const updated: CongressRegistration[] = [];

  for (const row of input.allocations) {
    const reg = byId.get(row.registrationId);
    if (!reg) return { ok: false, error: "unknown_registration" };
    if (reg.chargeAmountClp == null) {
      return { ok: false, error: "no_charge" };
    }
    const balance = remainingBalanceClp(reg);
    const amount = Math.trunc(row.amountClp);
    if (amount > balance) {
      return { ok: false, error: "allocation_exceeds_balance" };
    }
    updated.push({
      ...reg,
      allocatedPaidClp: reg.allocatedPaidClp + amount,
      version: reg.version + 1,
      updatedAt: input.createdAt,
    });
  }

  const payment: CongressPayment = {
    _id: input.paymentId,
    tenantId: input.tenantId,
    eventId: input.eventId,
    payerType: input.payerType,
    payerName: input.payerName.trim(),
    churchName: input.churchName ?? null,
    amountClp,
    method: input.method,
    paidOn: input.paidOn,
    receiptRef: input.receiptRef ?? null,
    note: input.note ?? null,
    allocations: input.allocations.map((a) => ({
      registrationId: a.registrationId,
      amountClp: Math.trunc(a.amountClp),
    })),
    unallocatedClp: amountClp - allocatedSum,
    status: "posted",
    createdByUserId: input.createdByUserId,
    createdAt: input.createdAt,
  };

  return { ok: true, payment, updatedRegistrations: updated };
}

export type VoidPaymentInput = {
  payment: CongressPayment;
  registrations: CongressRegistration[];
  voidedByUserId: string;
  reason: string;
  voidedAt: string;
};

export type VoidPaymentOk = {
  ok: true;
  payment: CongressPayment;
  updatedRegistrations: CongressRegistration[];
};

export type VoidPaymentErr = {
  ok: false;
  error: "already_voided" | "unknown_registration" | "missing_reason";
};

export type VoidPaymentResult = VoidPaymentOk | VoidPaymentErr;

export function voidPayment(input: VoidPaymentInput): VoidPaymentResult {
  const reason = input.reason.trim();
  if (reason.length < 5) return { ok: false, error: "missing_reason" };
  if (input.payment.status === "voided") {
    return { ok: false, error: "already_voided" };
  }

  const byId = new Map(input.registrations.map((r) => [r._id, r]));
  const updated: CongressRegistration[] = [];

  for (const row of input.payment.allocations) {
    const reg = byId.get(row.registrationId);
    if (!reg) return { ok: false, error: "unknown_registration" };
    const amount = Math.trunc(row.amountClp);
    const nextPaid = Math.max(0, reg.allocatedPaidClp - amount);
    updated.push({
      ...reg,
      allocatedPaidClp: nextPaid,
      version: reg.version + 1,
      updatedAt: input.voidedAt,
    });
  }

  const payment: CongressPayment = {
    ...input.payment,
    status: "voided",
    voidedAt: input.voidedAt,
    voidedByUserId: input.voidedByUserId,
    voidReason: reason,
    voidedAllocations: input.payment.allocations.map((a) => ({
      registrationId: a.registrationId,
      amountClp: Math.trunc(a.amountClp),
    })),
  };

  return { ok: true, payment, updatedRegistrations: updated };
}
