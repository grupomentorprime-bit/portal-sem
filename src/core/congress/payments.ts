import {
  normalizeCongressPaymentNote,
  normalizeCongressTransferBank,
} from "@/core/congress/banks";
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
  bank?: string | null;
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
    | "invalid_bank"
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
  const bank =
    input.method === "transfer" ? normalizeCongressTransferBank(input.bank) : null;
  if (input.method === "transfer" && !bank) {
    return { ok: false, error: "invalid_bank" };
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
    bank,
    paidOn: input.paidOn,
    receiptRef: input.receiptRef ?? null,
    note: normalizeCongressPaymentNote(input.note),
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

export type PaymentRevision = {
  payerName: string;
  method: CongressPaymentMethod;
  bank?: string | null;
  paidOn: string;
  receiptRef?: string | null;
  note?: string | null;
  amountClp: number;
};

export type RevisePaymentInput = PaymentRevision & {
  payment: CongressPayment;
  registrations: CongressRegistration[];
  revisedAt: string;
};

export type RevisePaymentOk = {
  ok: true;
  payment: CongressPayment;
  updatedRegistrations: CongressRegistration[];
};

export type RevisePaymentErr = {
  ok: false;
  error:
    | "empty_payer"
    | "invalid_method"
    | "invalid_bank"
    | "invalid_paid_on"
    | "invalid_amount"
    | "split_amount_locked"
    | "unknown_registration"
    | "no_charge"
    | "allocation_exceeds_balance";
};

export type RevisePaymentResult = RevisePaymentOk | RevisePaymentErr;

/**
 * Corrige el mismo comprobante (mismo folio) las veces que haga falta.
 * Un pago imputado a una sola ficha puede cambiar de monto.
 * Uno repartido conserva el monto y solo cambia datos del comprobante.
 * Si está anulado, no mueve saldos: eso lo hace restaurarlo.
 */
export function revisePayment(input: RevisePaymentInput): RevisePaymentResult {
  if (!PAYMENT_METHODS.has(input.method)) {
    return { ok: false, error: "invalid_method" };
  }
  const bank =
    input.method === "transfer" ? normalizeCongressTransferBank(input.bank) : null;
  if (input.method === "transfer" && !bank) {
    return { ok: false, error: "invalid_bank" };
  }
  if (!isValidPaidOn(input.paidOn)) {
    return { ok: false, error: "invalid_paid_on" };
  }
  const payerName = input.payerName.trim();
  if (!payerName) return { ok: false, error: "empty_payer" };

  const amountClp = Math.trunc(input.amountClp);
  if (!Number.isFinite(amountClp) || amountClp <= 0) {
    return { ok: false, error: "invalid_amount" };
  }

  const currentAllocations = input.payment.allocations.map((row) => ({
    registrationId: row.registrationId,
    amountClp: Math.trunc(row.amountClp),
  }));
  if (currentAllocations.length > 1 && amountClp !== input.payment.amountClp) {
    return { ok: false, error: "split_amount_locked" };
  }

  const nextAllocations =
    currentAllocations.length === 1
      ? [{ registrationId: currentAllocations[0].registrationId, amountClp }]
      : currentAllocations;
  const allocatedSum = nextAllocations.reduce((sum, row) => sum + row.amountClp, 0);
  const unallocatedClp =
    currentAllocations.length === 1 ? 0 : Math.max(0, amountClp - allocatedSum);

  const updatedRegistrations: CongressRegistration[] = [];
  if (input.payment.status === "posted") {
    const byId = new Map(input.registrations.map((row) => [row._id, row]));
    for (let index = 0; index < nextAllocations.length; index += 1) {
      const next = nextAllocations[index];
      const previous = currentAllocations[index];
      const delta = next.amountClp - (previous?.amountClp ?? 0);
      if (delta === 0) continue;
      const reg = byId.get(next.registrationId);
      if (!reg) return { ok: false, error: "unknown_registration" };
      if (reg.chargeAmountClp == null) return { ok: false, error: "no_charge" };
      const nextPaid = reg.allocatedPaidClp + delta;
      if (nextPaid < 0 || nextPaid > reg.chargeAmountClp) {
        return { ok: false, error: "allocation_exceeds_balance" };
      }
      updatedRegistrations.push({
        ...reg,
        allocatedPaidClp: nextPaid,
        version: reg.version + 1,
        updatedAt: input.revisedAt,
      });
    }
  }

  const voidedAllocations =
    input.payment.status === "voided"
      ? nextAllocations.map((row) => ({ ...row }))
      : (input.payment.voidedAllocations ?? null);

  return {
    ok: true,
    updatedRegistrations,
    payment: {
      ...input.payment,
      payerName,
      method: input.method,
      bank,
      paidOn: input.paidOn,
      receiptRef: input.receiptRef?.trim() ? input.receiptRef.trim() : null,
      note: normalizeCongressPaymentNote(input.note),
      amountClp,
      allocations: nextAllocations,
      unallocatedClp,
      voidedAllocations,
    },
  };
}

export type RestorePaymentInput = {
  payment: CongressPayment;
  registrations: CongressRegistration[];
  restoredAt: string;
};

export type RestorePaymentOk = {
  ok: true;
  payment: CongressPayment;
  updatedRegistrations: CongressRegistration[];
};

export type RestorePaymentErr = {
  ok: false;
  error: "not_voided" | "unknown_registration" | "no_charge" | "allocation_exceeds_balance";
};

export type RestorePaymentResult = RestorePaymentOk | RestorePaymentErr;

/** Vuelve a publicar un comprobante anulado para poder corregirlo o anularlo otra vez. */
export function restorePayment(input: RestorePaymentInput): RestorePaymentResult {
  if (input.payment.status !== "voided") {
    return { ok: false, error: "not_voided" };
  }

  const allocations =
    input.payment.allocations.length > 0
      ? input.payment.allocations
      : (input.payment.voidedAllocations ?? []);
  const byId = new Map(input.registrations.map((row) => [row._id, row]));
  const updatedRegistrations: CongressRegistration[] = [];

  for (const row of allocations) {
    const reg = byId.get(row.registrationId);
    if (!reg) return { ok: false, error: "unknown_registration" };
    if (reg.chargeAmountClp == null) return { ok: false, error: "no_charge" };
    const amount = Math.trunc(row.amountClp);
    const nextPaid = reg.allocatedPaidClp + amount;
    if (nextPaid > reg.chargeAmountClp) {
      return { ok: false, error: "allocation_exceeds_balance" };
    }
    const next = {
      ...reg,
      allocatedPaidClp: nextPaid,
      version: reg.version + 1,
      updatedAt: input.restoredAt,
    };
    byId.set(reg._id, next);
    updatedRegistrations.push(next);
  }

  return {
    ok: true,
    updatedRegistrations,
    payment: {
      ...input.payment,
      allocations: allocations.map((row) => ({
        registrationId: row.registrationId,
        amountClp: Math.trunc(row.amountClp),
      })),
      status: "posted",
      voidedAt: null,
      voidedByUserId: null,
      voidReason: null,
    },
  };
}

export function congressPaymentActionMessage(error: string): string {
  switch (error) {
    case "not_found":
      return "No se encontró el comprobante.";
    case "empty_payer":
      return "Indique el pagador.";
    case "invalid_method":
      return "Tipo de pago inválido.";
    case "invalid_bank":
      return "Indique el banco de la transferencia.";
    case "invalid_paid_on":
      return "Fecha de pago inválida.";
    case "invalid_amount":
      return "Indique un monto mayor a cero.";
    case "split_amount_locked":
      return "Un comprobante repartido en varias fichas conserva el monto. Corrija pagador, fecha o referencia, o anúlelo y registre otro.";
    case "unknown_registration":
      return "No se encontró la ficha imputada.";
    case "no_charge":
      return "La ficha no tiene aporte que corregir.";
    case "allocation_exceeds_balance":
      return "El monto supera el saldo de la ficha.";
    case "concurrent_payment":
      return "Otro cambio se guardó al mismo tiempo. Vuelva a intentarlo.";
    case "not_voided":
      return "El comprobante ya está vigente.";
    case "already_voided":
      return "Ese comprobante ya está anulado. Déjelo vigente si quiere anularlo otra vez.";
    default:
      return "No se pudo guardar el comprobante.";
  }
}
