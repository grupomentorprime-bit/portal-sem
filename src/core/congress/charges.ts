import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressRegistration } from "@/core/congress/types";

/**
 * Solo participantes con persona identificada generan cargo.
 * No se crea cargo por filas sin nombre ni por gaps de cantidad.
 */
export function eligibleForCharge(input: {
  fullName?: string | null;
  identityStatus?: CongressRegistration["identity"]["status"] | null;
}): boolean {
  const name = String(input.fullName ?? "").trim();
  if (!name) return false;
  // provisional y verified ambos tienen persona; el gap sin nombre no llega aquí.
  return true;
}

export function buildChargeAmountClp(input: {
  fullName?: string | null;
}): number | null {
  if (!eligibleForCharge(input)) return null;
  return CONGRESS_CONTRIBUTION_CLP;
}

export function remainingBalanceClp(reg: Pick<
  CongressRegistration,
  "chargeAmountClp" | "allocatedPaidClp"
>): number {
  if (reg.chargeAmountClp == null) return 0;
  return Math.max(0, reg.chargeAmountClp - reg.allocatedPaidClp);
}
