import type { CongressLodgingAssignment, CongressLodgingNeed } from "@/core/congress/types";

export type LodgingUiStatus =
  | "unknown"
  | "none"
  | "unassigned"
  | "assigned"
  | "confirmed";

export type LodgingPendingReason = "unknown" | "unassigned" | "unconfirmed";

export type LodgingUiState = {
  status: LodgingUiStatus;
  pendingReason?: LodgingPendingReason;
};

type AssignmentLike = Pick<CongressLodgingAssignment, "status" | "confirmed"> | null;

export function resolveLodgingUiState(input: {
  lodgingNeed: CongressLodgingNeed | null | undefined;
  assignment: AssignmentLike;
}): LodgingUiState {
  const need = input.lodgingNeed ?? "unknown";
  const assignment = input.assignment;
  const active =
    assignment &&
    assignment.status !== "cancelled" &&
    (assignment.status === "assigned" ||
      assignment.status === "confirmed" ||
      assignment.confirmed);

  if (active) {
    if (assignment.status === "confirmed" || assignment.confirmed) {
      return { status: "confirmed" };
    }
    return { status: "assigned", pendingReason: "unconfirmed" };
  }

  if (need === "none") return { status: "none" };
  if (need === "requested") {
    return { status: "unassigned", pendingReason: "unassigned" };
  }
  return { status: "unknown", pendingReason: "unknown" };
}

export function isLodgingPending(state: LodgingUiState): boolean {
  return state.status === "unknown" || state.status === "unassigned" || state.status === "assigned";
}

export function assertLodgingNeedAllowed(input: {
  lodgingNeed: CongressLodgingNeed;
  hasActiveAssignment: boolean;
}): { ok: true } | { ok: false; error: "none_with_active_assignment" } {
  if (input.lodgingNeed === "none" && input.hasActiveAssignment) {
    return { ok: false, error: "none_with_active_assignment" };
  }
  return { ok: true };
}

export function isActiveLodgingAssignment(
  assignment: AssignmentLike
): boolean {
  if (!assignment) return false;
  if (assignment.status === "cancelled") return false;
  return (
    assignment.status === "assigned" ||
    assignment.status === "confirmed" ||
    Boolean(assignment.confirmed)
  );
}
