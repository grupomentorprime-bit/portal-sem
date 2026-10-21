/**
 * Prioridad comercial calculada. No se persiste.
 * Una sola banda por oportunidad abierta.
 */

import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthNextAction, GrowthOportunidad } from "./types";

export const GROWTH_STALE_DAY_MS = 86_400_000;
export const GROWTH_DEFAULT_STALE_AFTER_DAYS = 7;
export const GROWTH_STALE_AFTER_DAYS_MIN = 1;
export const GROWTH_STALE_AFTER_DAYS_MAX = 90;

export type GrowthPriorityBand = "overdue" | "unfollowed" | "stale" | "current";

export const GROWTH_PRIORITY_BANDS = [
  "overdue",
  "unfollowed",
  "stale",
  "current",
] as const;

const BAND_RANK: Record<GrowthPriorityBand, number> = {
  overdue: 0,
  unfollowed: 1,
  stale: 2,
  current: 3,
};

export interface GrowthPriorityInput {
  status: string;
  nextAction: GrowthNextAction | null;
  openedAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export function normalizeStaleAfterDays(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < GROWTH_STALE_AFTER_DAYS_MIN ||
    parsed > GROWTH_STALE_AFTER_DAYS_MAX
  ) {
    return GROWTH_DEFAULT_STALE_AFTER_DAYS;
  }
  return parsed;
}

function time(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function growthPriorityBand(
  item: GrowthPriorityInput,
  now: Date,
  staleAfterDays: number = GROWTH_DEFAULT_STALE_AFTER_DAYS
): GrowthPriorityBand | null {
  if (isGrowthOpportunityFinalStatus(item.status)) return null;
  const nowMs = now.getTime();
  const due = time(item.nextAction?.dueAt);
  if (item.nextAction && due != null && due < nowMs) return "overdue";
  if (item.nextAction == null) return "unfollowed";
  const last =
    time(item.lastActivityAt) ?? time(item.updatedAt) ?? time(item.openedAt) ?? nowMs;
  const days = normalizeStaleAfterDays(staleAfterDays);
  if (nowMs - last >= days * GROWTH_STALE_DAY_MS) return "stale";
  return "current";
}

/** Clave ascendente dentro de la banda. `null` conserva el orden previo. */
export function growthPrioritySortKey(
  item: GrowthPriorityInput,
  band: GrowthPriorityBand | null
): number | null {
  if (band === "overdue") return time(item.nextAction?.dueAt);
  if (band === "unfollowed") return time(item.openedAt);
  if (band === "stale") {
    return time(item.lastActivityAt) ?? time(item.updatedAt) ?? time(item.openedAt);
  }
  return null;
}

export function compareGrowthPriority(
  a: GrowthPriorityInput,
  b: GrowthPriorityInput,
  now: Date,
  staleAfterDays: number
): number {
  const bandA = growthPriorityBand(a, now, staleAfterDays);
  const bandB = growthPriorityBand(b, now, staleAfterDays);
  const rankA = bandA ? BAND_RANK[bandA] : 4;
  const rankB = bandB ? BAND_RANK[bandB] : 4;
  if (rankA !== rankB) return rankA - rankB;
  const keyA = growthPrioritySortKey(a, bandA);
  const keyB = growthPrioritySortKey(b, bandB);
  if (keyA != null && keyB != null && keyA !== keyB) return keyA - keyB;
  return 0;
}

export function priorityInputFromOpportunity(
  oportunidad: Pick<
    GrowthOportunidad,
    "status" | "nextAction" | "openedAt" | "updatedAt" | "lastActivityAt"
  >
): GrowthPriorityInput {
  return {
    status: oportunidad.status,
    nextAction: oportunidad.nextAction,
    openedAt: oportunidad.openedAt,
    updatedAt: oportunidad.updatedAt,
    lastActivityAt: oportunidad.lastActivityAt,
  };
}
