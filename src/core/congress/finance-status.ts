import { remainingBalanceClp } from "@/core/congress/charges";
import { countsAsPendingVerification } from "@/core/congress/form-engagement";
import type { CongressRegistration } from "@/core/congress/types";

type ContributionReg = Pick<
  CongressRegistration,
  "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
> &
  Partial<Pick<CongressRegistration, "source" | "submissionId">>;

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
export function deriveContributionStatus(reg: ContributionReg): ContributionStatus {
  if (reg.chargeAmountClp == null) return "no_charge";
  if (countsAsPendingVerification(reg)) return "needs_verification";
  const paid = Math.max(0, Math.trunc(reg.allocatedPaidClp));
  const charge = Math.trunc(reg.chargeAmountClp);
  if (paid <= 0) return "pending";
  if (paid < charge) return "partial";
  if (remainingBalanceClp(reg) === 0 && !countsAsPendingVerification(reg)) return "paid";
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

/** Exención grupal: solo quien tiene cargo y todavía no tiene pago imputado. */
export function canExemptGroupMember(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp">
): boolean {
  if (reg.chargeAmountClp == null) return false;
  return Math.max(0, Math.trunc(reg.allocatedPaidClp)) === 0;
}
