/**
 * Indicadores de la cola de Ventas.
 * Cuentan la misma proyección que las filas, antes del filtro de banda.
 */

import type { GrowthPriorityBand } from "@/core/growth/priority";

export interface VentasAttentionCounts {
  overdue: number;
  unfollowed: number;
  stale: number;
  /** Abiertas sin responsable. Puede solaparse con una banda de prioridad. */
  unassigned: number;
}

export interface VentasAttentionItem {
  priorityBand: GrowthPriorityBand | null;
  ownerUserId?: string;
}

export function countVentasAttention(items: VentasAttentionItem[]): VentasAttentionCounts {
  const counts: VentasAttentionCounts = {
    overdue: 0,
    unfollowed: 0,
    stale: 0,
    unassigned: 0,
  };
  for (const item of items) {
    if (item.priorityBand === "overdue") counts.overdue += 1;
    else if (item.priorityBand === "unfollowed") counts.unfollowed += 1;
    else if (item.priorityBand === "stale") counts.stale += 1;
    if (item.priorityBand && !item.ownerUserId) counts.unassigned += 1;
  }
  return counts;
}

/** La banda acota las filas. Los indicadores se calculan antes de aplicarla. */
export function matchesVentasBand(item: VentasAttentionItem, band: string): boolean {
  if (!band) return true;
  if (band === "unassigned") return Boolean(item.priorityBand) && !item.ownerUserId;
  return item.priorityBand === band;
}
