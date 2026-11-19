import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressChargeHistoryEntry } from "@/core/congress/types";

export const CHARGE_WAIVE_REASONS = [
  "Invitado",
  "Staff",
  "Cortesía",
  "Pastor",
  "Acuerdo de la iglesia",
  "Otro",
] as const;

export type ApplyChargeChangeInput = {
  chargeAmountClp: number | null;
  allocatedPaidClp: number;
  chargeHistory: CongressChargeHistoryEntry[];
  action: "exempt" | "restore" | "reduce";
  reason?: string;
  /** Monto que no se cobra, cuando la acción es una parte. */
  waiveClp?: number;
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
      error:
        | "reason_required"
        | "has_allocations"
        | "not_exempt"
        | "already_charged"
        | "waive_invalid"
        | "waive_too_high"
        | "below_paid"
        | "no_charge";
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

  if (input.action === "reduce") {
    const waive = Math.trunc(Number(input.waiveClp));
    if (!Number.isFinite(waive) || waive <= 0) {
      return { ok: false, error: "waive_invalid" };
    }
    if (input.chargeAmountClp == null) return { ok: false, error: "no_charge" };
    const next = input.chargeAmountClp - waive;
    if (next < 0) return { ok: false, error: "waive_too_high" };
    const paid = Math.max(0, Math.trunc(input.allocatedPaidClp));
    if (next < paid) return { ok: false, error: "below_paid" };
    if (next === 0) {
      if (paid > 0) return { ok: false, error: "has_allocations" };
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
    const entry: CongressChargeHistoryEntry = {
      action: "reduce",
      previousChargeAmountClp: input.chargeAmountClp,
      nextChargeAmountClp: next,
      reason,
      at: input.nowIso,
      actorUserId: input.actorUserId,
    };
    return {
      ok: true,
      chargeAmountClp: next,
      chargeHistory: [...history, entry],
    };
  }

  if (input.chargeAmountClp != null && input.chargeAmountClp >= CONGRESS_CONTRIBUTION_CLP) {
    return { ok: false, error: "already_charged" };
  }
  const canRestore =
    (input.chargeAmountClp == null && hasExempt) ||
    (input.chargeAmountClp != null &&
      history.some((entry) => entry.action === "reduce" || entry.action === "exempt"));
  if (!canRestore) {
    return { ok: false, error: "not_exempt" };
  }
  const entry: CongressChargeHistoryEntry = {
    action: "restore",
    previousChargeAmountClp: input.chargeAmountClp,
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

/** Lo que hoy no cobra esta ficha, con el motivo vigente. */
export function activeChargeConsideration(reg: {
  chargeAmountClp: number | null;
  chargeHistory?: CongressChargeHistoryEntry[] | null;
}): { unpaidClp: number; reason: string; total: boolean } | null {
  const history = reg.chargeHistory ?? [];
  const last = history[history.length - 1];
  if (!last || last.action === "restore") return null;
  const reason = last.reason.trim();
  if (!reason) return null;

  if (reg.chargeAmountClp == null && last.action === "exempt") {
    return { unpaidClp: CONGRESS_CONTRIBUTION_CLP, reason, total: true };
  }

  if (reg.chargeAmountClp == null || last.action === "exempt") return null;
  const charge = Math.trunc(reg.chargeAmountClp);
  const unpaidClp = CONGRESS_CONTRIBUTION_CLP - charge;
  if (unpaidClp <= 0 || last.action !== "reduce") return null;
  return { unpaidClp, reason, total: false };
}
