import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressChargeHistoryEntry } from "@/core/congress/types";

export type ApplyChargeChangeInput = {
  chargeAmountClp: number | null;
  allocatedPaidClp: number;
  chargeHistory: CongressChargeHistoryEntry[];
  action: "exempt" | "restore";
  reason?: string;
  nowIso: string;
  actorUserId: string;
};

export type ApplyChargeChangeResult =
  | {
      ok: true;
      chargeAmountClp: number | null;
      chargeHistory: CongressChargeHistoryEntry[];
      idempotent?: boolean;
    }
  | {
      ok: false;
      error: "reason_required" | "has_allocations" | "not_exempt" | "already_charged";
    };

export function applyChargeChange(
  input: ApplyChargeChangeInput
): ApplyChargeChangeResult {
  const reason = String(input.reason ?? "").trim();
  if (!reason) return { ok: false, error: "reason_required" };

  const history = [...(input.chargeHistory ?? [])];
  const hasExempt = history.some((h) => h.action === "exempt");

  if (input.action === "exempt") {
    if (Math.max(0, Math.trunc(input.allocatedPaidClp)) > 0) {
      return { ok: false, error: "has_allocations" };
    }
    if (input.chargeAmountClp == null) {
      return {
        ok: true,
        chargeAmountClp: null,
        chargeHistory: history,
        idempotent: true,
      };
    }
    const entry: CongressChargeHistoryEntry = {
      action: "exempt",
      previousChargeAmountClp: input.chargeAmountClp,
      nextChargeAmountClp: null,
      reason,
      at: input.nowIso,
      actorUserId: input.actorUserId,
    };
    return {
      ok: true,
      chargeAmountClp: null,
      chargeHistory: [...history, entry],
    };
  }

  if (input.chargeAmountClp != null) {
    return { ok: false, error: "already_charged" };
  }
  if (!hasExempt) {
    return { ok: false, error: "not_exempt" };
  }
  const entry: CongressChargeHistoryEntry = {
    action: "restore",
    previousChargeAmountClp: null,
    nextChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    reason,
    at: input.nowIso,
    actorUserId: input.actorUserId,
  };
  return {
    ok: true,
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    chargeHistory: [...history, entry],
  };
}

export function isExplicitlyExempt(reg: {
  chargeAmountClp: number | null;
  chargeHistory?: CongressChargeHistoryEntry[] | null;
}): boolean {
  return (
    reg.chargeAmountClp == null &&
    (reg.chargeHistory ?? []).some((h) => h.action === "exempt")
  );
}
