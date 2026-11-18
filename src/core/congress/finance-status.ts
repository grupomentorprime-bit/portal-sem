import { remainingBalanceClp } from "@/core/congress/charges";
import type { CongressRegistration } from "@/core/congress/types";

export type ContributionStatus =
  | "no_charge"
  | "needs_verification"
  | "pending"
  | "partial"
  | "paid";

/**
 * Deriva el estado de alimentación/aporte del motor existente.
 * Saldo 0 con needsReview no es "Pagado".
 */
export function deriveContributionStatus(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
): ContributionStatus {
  if (reg.chargeAmountClp == null) return "no_charge";
  if (reg.needsReview) return "needs_verification";
  const paid = Math.max(0, Math.trunc(reg.allocatedPaidClp));
  const charge = Math.trunc(reg.chargeAmountClp);
  if (paid <= 0) return "pending";
  if (paid < charge) return "partial";
  if (remainingBalanceClp(reg) === 0 && !reg.needsReview) return "paid";
  return "needs_verification";
}

export function contributionStatusHasBalance(status: ContributionStatus): boolean {
  return status === "pending" || status === "partial" || status === "needs_verification";
}

/** Pago grupal: seleccionable si queda saldo de cargo. */
export function isGroupPaymentSelectable(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
): boolean {
  return remainingBalanceClp(reg) > 0;
}
