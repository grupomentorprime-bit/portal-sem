/**
 * Panel comercial y Mi trabajo. Conteos reales de la oportunidad, sin métricas inventadas.
 */

import "server-only";

import {
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  createMongoGrowthOpportunityStore,
  type GrowthOportunidad,
  type GrowthPersona,
} from "@/core/growth";
import { openGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { stageLabel, stagesFromDefinition } from "@/core/growth/funnel-stages";
import type { GrowthFunnelStage } from "@/core/growth/funnel-types";
import { isGrowthOpportunityFinalStatus } from "@/core/growth/opportunity-definition";
import { growthPriorityBand, priorityInputFromOpportunity } from "@/core/growth/priority";
import { resolveGrowthSpaceConfig } from "@/core/growth/space-config";
import {
  countGrowthBands,
  countUnassignedOpportunities,
  growthWorkRelation,
  myGrowthWork,
  priorityGrowthQueue,
} from "@/core/growth/work-queue";
import { getDatabase } from "@/lib/mongodb";
import { growthOpportunityStatusLabel, growthPriorityBandLabel } from "./labels";
import { listGrowthSpaceMembers } from "./space-members";

export interface CommercialQueueRow {
  id: string;
  personaLabel: string;
  funnelName: string;
  stageLabel: string;
  bandLabel: string;
  band: string | null;
  dueAt?: string;
  nextActionSummary: string;
  relationLabel?: string;
  href: string;
  /** Antigüedad legible para Inicio / colas (días desde vencimiento, apertura o última actividad). */
  ageLabel?: string;
  ownerLabel?: string;
}

export interface CommercialPanelRead {
  scope: "space" | "mine";
  overdue: number;
  unfollowed: number;
  stale: number;
  unassigned: number;
  rows: CommercialQueueRow[];
}

export interface MyWorkRead {
  overdue: CommercialQueueRow[];
  unfollowed: CommercialQueueRow[];
  stale: CommercialQueueRow[];
  current: CommercialQueueRow[];
  empty: boolean;
}

async function loadOpen(tenantId: string) {
  const db = await getDatabase();
  const store = createMongoGrowthOpportunityStore(db);
  const config = await resolveGrowthSpaceConfig(store, tenantId);
  const directory = await openGrowthFunnelDirectory(db);
  const [opportunities, funnels, personas, members] = await Promise.all([
    db
      .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
      .find({ tenantId, status: { $nin: ["won", "lost", "archived", "handed_off"] } })
      .toArray(),
    directory.listFunnels(tenantId),
    db.collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION).find({ tenantId }).toArray(),
    listGrowthSpaceMembers(tenantId),
  ]);
  const scopedFunnels = funnels.filter((funnel) => funnel.tenantId === tenantId);
  const stagesByFunnel = new Map<string, GrowthFunnelStage[]>();
  for (const funnel of scopedFunnels) {
    const definition = await directory.getDefinition(tenantId, funnel.workflowDefinitionKey);
    stagesByFunnel.set(funnel.key, stagesFromDefinition(definition));
  }
  const own = opportunities.filter(
    (item) => item.tenantId === tenantId && !isGrowthOpportunityFinalStatus(item.status)
  );
  const ownerLabelById = new Map(
    members.map((member) => [member.userId, member.label] as const)
  );
  return {
    now: new Date(),
    staleAfterDays: config.staleAfterDays ?? 7,
    opportunities: own,
    funnels: scopedFunnels,
    stagesByFunnel,
    personas,
    ownerLabelById,
  };
}

function commercialAgeLabel(
  item: GrowthOportunidad,
  band: string | null,
  now: Date
): string {
  const dayMs = 86_400_000;
  const refIso =
    band === "overdue"
      ? item.nextAction?.dueAt
      : band === "unfollowed"
        ? item.openedAt
        : item.lastActivityAt ?? item.updatedAt ?? item.openedAt;
  const refMs = refIso ? Date.parse(refIso) : NaN;
  if (!Number.isFinite(refMs)) return "—";
  const days = Math.max(0, Math.floor((now.getTime() - refMs) / dayMs));
  if (days === 0) return "Hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

const RELATION_LABEL = {
  owner: "Tu oportunidad",
  action: "Próxima acción asignada",
  both: "Tu oportunidad y tu próxima acción",
} as const;

function toRow(
  item: GrowthOportunidad,
  loaded: Awaited<ReturnType<typeof loadOpen>>,
  userId?: string
): CommercialQueueRow {
  const persona = loaded.personas.find(
    (entry) => entry._id === item.personaId && entry.tenantId === item.tenantId
  );
  const funnelKey = item.funnelKey || "default";
  const funnel = loaded.funnels.find((entry) => entry.key === funnelKey);
  const stages = loaded.stagesByFunnel.get(funnelKey) ?? [];
  const band = growthPriorityBand(
    priorityInputFromOpportunity(item),
    loaded.now,
    loaded.staleAfterDays
  );
  const relation = userId ? growthWorkRelation(item, userId) : null;
  const ownerId = item.ownerUserId?.trim();
  return {
    id: item._id,
    personaLabel: persona?.displayName ?? "Persona",
    funnelName: funnel?.name ?? "Ventas",
    stageLabel:
      stages.length > 0 ? stageLabel(stages, item.status) : growthOpportunityStatusLabel(item.status),
    bandLabel: growthPriorityBandLabel(band),
    band,
    dueAt: item.nextAction?.dueAt,
    nextActionSummary: item.nextAction?.summary ?? "Sin seguimiento",
    relationLabel: relation ? RELATION_LABEL[relation] : undefined,
    href: `/admin/ventas/${encodeURIComponent(item._id)}`,
    ageLabel: commercialAgeLabel(item, band, loaded.now),
    ownerLabel: ownerId
      ? loaded.ownerLabelById.get(ownerId) ?? "Responsable"
      : undefined,
  };
}

export async function readCommercialPanel(
  tenantId: string,
  userId: string,
  spaceWide: boolean
): Promise<CommercialPanelRead> {
  const loaded = await loadOpen(tenantId);
  const mine = myGrowthWork(
    loaded.opportunities,
    userId,
    tenantId,
    loaded.now,
    loaded.staleAfterDays
  );
  const list = spaceWide
    ? loaded.opportunities
    : [...mine.overdue, ...mine.unfollowed, ...mine.stale, ...mine.current];
  const counts = countGrowthBands(list, loaded.now, loaded.staleAfterDays);
  const rows = priorityGrowthQueue(list, loaded.now, loaded.staleAfterDays, 10).map((item) =>
    toRow(item, loaded, spaceWide ? undefined : userId)
  );
  return {
    scope: spaceWide ? "space" : "mine",
    overdue: counts.overdue,
    unfollowed: counts.unfollowed,
    stale: counts.stale,
    unassigned: spaceWide ? countUnassignedOpportunities(loaded.opportunities) : 0,
    rows,
  };
}

export async function readMyWork(tenantId: string, userId: string): Promise<MyWorkRead> {
  const loaded = await loadOpen(tenantId);
  const sections = myGrowthWork(
    loaded.opportunities,
    userId,
    tenantId,
    loaded.now,
    loaded.staleAfterDays
  );
  const map = (items: GrowthOportunidad[]) => items.map((item) => toRow(item, loaded, userId));
  const overdue = map(sections.overdue);
  const unfollowed = map(sections.unfollowed);
  const stale = map(sections.stale);
  const current = map(sections.current);
  return {
    overdue,
    unfollowed,
    stale,
    current,
    empty: overdue.length + unfollowed.length + stale.length + current.length === 0,
  };
}
