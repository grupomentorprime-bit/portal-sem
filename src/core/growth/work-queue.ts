/**
 * Lecturas de trabajo derivadas de la oportunidad. No hay colección de tareas.
 */

import {
  growthPriorityBand,
  priorityInputFromOpportunity,
  type GrowthPriorityBand,
} from "./priority";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthOportunidad } from "./types";

export interface GrowthWorkSections<T> {
  overdue: T[];
  unfollowed: T[];
  stale: T[];
  current: T[];
}

function sortSection(
  items: GrowthOportunidad[],
  band: GrowthPriorityBand
): GrowthOportunidad[] {
  return items.slice().sort((a, b) => {
    const left = priorityInputFromOpportunity(a);
    const right = priorityInputFromOpportunity(b);
    const key = (item: GrowthOportunidad) => {
      if (band === "overdue") return Date.parse(item.nextAction?.dueAt ?? "") || 0;
      if (band === "unfollowed") return Date.parse(item.openedAt) || 0;
      return Date.parse(item.lastActivityAt ?? item.updatedAt) || 0;
    };
    return key(a) - key(b) || left.openedAt.localeCompare(right.openedAt);
  });
}

export function isOpenGrowthOpportunity(oportunidad: GrowthOportunidad): boolean {
  return !isGrowthOpportunityFinalStatus(oportunidad.status);
}

export function opportunityActionAssignee(oportunidad: GrowthOportunidad): string | null {
  return oportunidad.nextAction?.assigneeUserId?.trim() || null;
}

/** La acción sin responsable propio recae en el responsable de la oportunidad. */
export function opportunityWorkUserIds(oportunidad: GrowthOportunidad): string[] {
  const ids = new Set<string>();
  if (oportunidad.ownerUserId?.trim()) ids.add(oportunidad.ownerUserId.trim());
  const assignee = opportunityActionAssignee(oportunidad);
  if (assignee) ids.add(assignee);
  else if (oportunidad.ownerUserId?.trim() && oportunidad.nextAction) {
    ids.add(oportunidad.ownerUserId.trim());
  }
  return [...ids];
}

export function opportunityBelongsToUser(
  oportunidad: GrowthOportunidad,
  userId: string
): boolean {
  return opportunityWorkUserIds(oportunidad).includes(userId);
}

/** Una sola fila puede ser responsabilidad, acción asignada, o las dos. */
export function growthWorkRelation(
  oportunidad: GrowthOportunidad,
  userId: string
): "owner" | "action" | "both" | null {
  const owner = oportunidad.ownerUserId?.trim() === userId;
  const assignee = opportunityActionAssignee(oportunidad);
  const actionMine =
    assignee === userId || (!assignee && owner && Boolean(oportunidad.nextAction));
  if (owner && actionMine) return "both";
  if (owner) return "owner";
  if (actionMine) return "action";
  return null;
}

export function splitGrowthWork<T extends GrowthOportunidad>(
  items: T[],
  now: Date,
  staleAfterDays: number
): GrowthWorkSections<T> {
  const sections: GrowthWorkSections<T> = {
    overdue: [],
    unfollowed: [],
    stale: [],
    current: [],
  };
  for (const item of items) {
    if (item == null || !isOpenGrowthOpportunity(item)) continue;
    const band = growthPriorityBand(priorityInputFromOpportunity(item), now, staleAfterDays);
    if (!band) continue;
    sections[band].push(item);
  }
  sections.overdue = sortSection(sections.overdue, "overdue") as T[];
  sections.unfollowed = sortSection(sections.unfollowed, "unfollowed") as T[];
  sections.stale = sortSection(sections.stale, "stale") as T[];
  sections.current = sortSection(sections.current, "current") as T[];
  return sections;
}

export function myGrowthWork<T extends GrowthOportunidad>(
  items: T[],
  userId: string,
  tenantId: string,
  now: Date,
  staleAfterDays: number
): GrowthWorkSections<T> {
  const seen = new Set<string>();
  const own: T[] = [];
  for (const item of items) {
    if (!item || item.tenantId !== tenantId) continue;
    if (item.ownerUserId == null && !opportunityActionAssignee(item)) continue;
    if (!opportunityBelongsToUser(item, userId)) continue;
    if (seen.has(item._id)) continue;
    seen.add(item._id);
    own.push(item);
  }
  return splitGrowthWork(own, now, staleAfterDays);
}

export function countGrowthBands(
  items: GrowthOportunidad[],
  now: Date,
  staleAfterDays: number
): Record<"overdue" | "unfollowed" | "stale" | "current", number> {
  const sections = splitGrowthWork(items, now, staleAfterDays);
  return {
    overdue: sections.overdue.length,
    unfollowed: sections.unfollowed.length,
    stale: sections.stale.length,
    current: sections.current.length,
  };
}

export function countUnassignedOpportunities(items: GrowthOportunidad[]): number {
  return items.filter(
    (item) => isOpenGrowthOpportunity(item) && !item.ownerUserId?.trim()
  ).length;
}

/** Cola de prioridad del Espacio: vencidas, sin seguimiento y estancadas. */
export function priorityGrowthQueue(
  items: GrowthOportunidad[],
  now: Date,
  staleAfterDays: number,
  limit = 10
): GrowthOportunidad[] {
  const sections = splitGrowthWork(items, now, staleAfterDays);
  return [...sections.overdue, ...sections.unfollowed, ...sections.stale].slice(0, limit);
}
