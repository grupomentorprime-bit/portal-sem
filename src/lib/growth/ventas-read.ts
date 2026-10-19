/**
 * OT-GROWTH-SALES-001 — lectura tenant-scoped de Oportunidades para cola Ventas.
 * Proyección UI; dominio permanece en Growth Core.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  createMongoGrowthOpportunityStore,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthPersona,
} from "@/core/growth";
import { getGrowthAssessmentPort } from "@/core/growth/assessment";
import { presentFunnelFieldRows } from "@/core/growth/custom-fields";
import {
  growthPriorityBand,
  growthPrioritySortKey,
  priorityInputFromOpportunity,
} from "@/core/growth/priority";
import { resolveGrowthSpaceConfig } from "@/core/growth/space-config";
import { openGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { availableGrowthFunnelTransitions } from "@/core/growth/funnels";
import {
  stageLabel,
  stagesFromDefinition,
} from "@/core/growth/funnel-stages";
import type { GrowthFunnel, GrowthFunnelStage } from "@/core/growth/funnel-types";
import { getDatabase } from "@/lib/mongodb";
import { ensureLiveGrowthFunnels } from "./funnels-live";
import { listGrowthSpaceMembers } from "./space-members";
import { humanizeOriginDisplayLabel } from "./humanize-origin-display";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  growthActivityKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginArrivalLabel,
} from "./labels";
import { presentOpportunityStageTrack } from "./opportunity-stage-track";
import { listPersonaConversationViews } from "./personas-read";
import {
  activitiesVisibleInUi,
  escapeGrowthSearchRegex,
  sortActivitiesNewestFirst,
  toActivityView,
  toOportunidadDetailView,
} from "./persona-view";
import {
  growthVentasBoardLanes,
  growthVentasStatusOptions,
} from "./ventas-board";
import type {
  GrowthVentasBoardLane,
  GrowthVentasFunnelOption,
  GrowthVentasOpportunityOperateView,
  GrowthVentasQueueItemView,
  GrowthVentasStatusOption,
} from "./ventas-view";

export type {
  GrowthVentasOpportunityOperateView,
  GrowthVentasQueueItemView,
} from "./ventas-view";

export interface GrowthVentasListFilters {
  q?: string;
  status?: string;
  type?: string;
  funnel?: string;
  /** "with" | "without" | "" */
  nextAction?: string;
  /** overdue | unfollowed | stale | current | unassigned */
  band?: string;
  limit?: number;
}

export interface GrowthVentasQueueRead {
  items: GrowthVentasQueueItemView[];
  funnels: GrowthVentasFunnelOption[];
  lanes: GrowthVentasBoardLane[];
  statusOptions: GrowthVentasStatusOption[];
}

async function loadFunnelContext(tenantId: string): Promise<{
  funnels: GrowthFunnel[];
  stagesByFunnel: Map<string, GrowthFunnelStage[]>;
}> {
  await ensureLiveGrowthFunnels(tenantId);
  const db = await getDatabase();
  const directory = await openGrowthFunnelDirectory(db);
  const funnels = (await directory.listFunnels(tenantId)).filter(
    (funnel) => funnel.tenantId === tenantId
  );
  const stagesByFunnel = new Map<string, GrowthFunnelStage[]>();
  for (const funnel of funnels) {
    const definition = await directory.getDefinition(
      tenantId,
      funnel.workflowDefinitionKey
    );
    stagesByFunnel.set(funnel.key, stagesFromDefinition(definition));
  }
  return { funnels, stagesByFunnel };
}

function presentQueueItem(
  oportunidad: GrowthOportunidad,
  persona: GrowthPersona | undefined,
  last: GrowthActivity | undefined,
  funnels: GrowthFunnel[],
  stagesByFunnel: Map<string, GrowthFunnelStage[]>,
  now: Date,
  staleAfterDays: number,
  ownerLabel?: string
): GrowthVentasQueueItemView {
  const funnelKey = oportunidad.funnelKey || "default";
  const funnel = funnels.find((item) => item.key === funnelKey && item.tenantId === oportunidad.tenantId);
  const stages = stagesByFunnel.get(funnelKey) ?? [];
  const label = stages.length > 0 ? stageLabel(stages, oportunidad.status) : growthOpportunityStatusLabel(oportunidad.status);
  const priority = priorityInputFromOpportunity({
    ...oportunidad,
    lastActivityAt: oportunidad.lastActivityAt ?? last?.occurredAt,
  });
  const priorityBand = growthPriorityBand(priority, now, staleAfterDays);
  const rank = { overdue: 0, unfollowed: 1, stale: 2, current: 3 } as const;
  return {
    id: oportunidad._id,
    personaId: oportunidad.personaId,
    personaDisplayName: persona?.displayName ?? "Persona",
    originLabel: humanizeOriginDisplayLabel(growthOriginArrivalLabel(oportunidad.origin)),
    typeLabel: growthOpportunityTypeLabel(oportunidad.typeKey),
    typeKey: oportunidad.typeKey,
    status: oportunidad.status,
    statusLabel: label,
    funnelKey,
    funnelName: funnel?.name ?? "Ventas",
    stageLabel: label,
    availableTransitions: availableGrowthFunnelTransitions(stages, oportunidad.status),
    nextActionLabel: oportunidad.nextAction?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL,
    hasNextAction: Boolean(oportunidad.nextAction),
    lastActivityLabel: last
      ? last.summary || growthActivityKindLabel(last.kind)
      : "Sin actividad",
    lastActivityAt: oportunidad.lastActivityAt ?? last?.occurredAt,
    openedAt: oportunidad.openedAt,
    updatedAt: oportunidad.updatedAt,
    priorityBand,
    priorityRank: priorityBand ? rank[priorityBand] : 4,
    priorityKey: growthPrioritySortKey(priority, priorityBand),
    ownerUserId: oportunidad.ownerUserId,
    ownerLabel,
  };
}

async function personaIdsMatchingSearch(
  tenantId: string,
  q: string
): Promise<string[]> {
  const db = await getDatabase();
  const rx = new RegExp(escapeGrowthSearchRegex(q), "i");
  const personas = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .find(
      {
        tenantId,
        status: { $ne: "merged" },
        $or: [
          { displayName: rx },
          { email: rx },
          { phone: rx },
          { emailNormalized: rx },
          { phoneNormalized: rx },
        ],
      },
      { projection: { _id: 1 } }
    )
    .toArray();
  return personas.map((p) => p._id);
}

export async function readGrowthVentasBoard(
  tenantId: string,
  filters: GrowthVentasListFilters = {}
): Promise<GrowthVentasQueueRead> {
  const db = await getDatabase();
  const { funnels, stagesByFunnel } = await loadFunnelContext(tenantId);
  const store = createMongoGrowthOpportunityStore(db);
  const config = await resolveGrowthSpaceConfig(store, tenantId);
  const now = new Date();
  const members = await listGrowthSpaceMembers(tenantId);
  const ownerLabels = new Map(members.map((member) => [member.userId, member.label]));
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  const funnelFilter = filters.funnel?.trim();

  const filter: Filter<GrowthOportunidad> = { tenantId };
  const status = filters.status?.trim();
  const typeKey = filters.type?.trim();
  if (status) filter.status = status;
  if (typeKey) filter.typeKey = typeKey;
  if (funnelFilter) filter.funnelKey = funnelFilter;

  const nextAction = filters.nextAction?.trim();
  if (nextAction === "with") {
    filter.nextAction = { $ne: null };
  } else if (nextAction === "without") {
    filter.$or = [{ nextAction: null }, { nextAction: { $exists: false } }];
  }

  const q = filters.q?.trim();
  if (q) {
    const personaIds = await personaIdsMatchingSearch(tenantId, q);
    if (personaIds.length === 0) {
      return emptyBoard(tenantId, funnels, stagesByFunnel, funnelFilter);
    }
    filter.personaId = { $in: personaIds };
  }

  const oportunidades = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  if (oportunidades.length === 0) {
    return emptyBoard(tenantId, funnels, stagesByFunnel, funnelFilter);
  }

  const personaIds = [...new Set(oportunidades.map((o) => o.personaId))];
  const oportunidadIds = oportunidades.map((o) => o._id);

  const [personas, activities] = await Promise.all([
    db
      .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
      .find({ tenantId, _id: { $in: personaIds } })
      .toArray(),
    db
      .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
      .find({ tenantId, oportunidadId: { $in: oportunidadIds } })
      .sort({ occurredAt: -1 })
      .toArray(),
  ]);

  const personaById = new Map(personas.map((p) => [p._id, p]));
  const lastActivityByOpp = new Map<string, GrowthActivity>();
  for (const a of activitiesVisibleInUi(activities)) {
    if (!a.oportunidadId) continue;
    if (!lastActivityByOpp.has(a.oportunidadId)) {
      lastActivityByOpp.set(a.oportunidadId, a);
    }
  }

  const items = oportunidades
    .filter((oportunidad) => oportunidad.tenantId === tenantId)
    .map((oportunidad) =>
      presentQueueItem(
        oportunidad,
        personaById.get(oportunidad.personaId),
        lastActivityByOpp.get(oportunidad._id),
        funnels,
        stagesByFunnel,
        now,
        config.staleAfterDays ?? 7,
        oportunidad.ownerUserId ? ownerLabels.get(oportunidad.ownerUserId) : undefined
      )
    );

  const band = filters.band?.trim();
  const visible = items.filter((item) => {
    if (!band) return true;
    if (band === "unassigned") return !item.ownerUserId && item.priorityBand != null;
    return item.priorityBand === band;
  });

  return presentBoard(tenantId, funnels, stagesByFunnel, funnelFilter, visible);
}

export async function listGrowthVentasQueue(
  tenantId: string,
  filters: GrowthVentasListFilters = {}
): Promise<GrowthVentasQueueItemView[]> {
  const board = await readGrowthVentasBoard(tenantId, filters);
  return board.items;
}

function presentFunnels(funnels: GrowthFunnel[]): GrowthVentasFunnelOption[] {
  return funnels
    .slice()
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name, "es")
    )
    .map((funnel) => ({
      key: funnel.key,
      name: funnel.status === "archived" ? `${funnel.name} (archivado)` : funnel.name,
      isDefault: funnel.isDefault,
      status: funnel.status,
    }));
}

function presentBoard(
  tenantId: string,
  funnels: GrowthFunnel[],
  stagesByFunnel: Map<string, GrowthFunnelStage[]>,
  funnelFilter: string | undefined,
  items: GrowthVentasQueueItemView[]
): GrowthVentasQueueRead {
  return {
    items,
    funnels: presentFunnels(funnels),
    lanes: growthVentasBoardLanes(tenantId, funnels, stagesByFunnel, funnelFilter, items),
    statusOptions: growthVentasStatusOptions(
      tenantId,
      funnels,
      stagesByFunnel,
      funnelFilter
    ),
  };
}

function emptyBoard(
  tenantId: string,
  funnels: GrowthFunnel[],
  stagesByFunnel: Map<string, GrowthFunnelStage[]>,
  funnelFilter: string | undefined
): GrowthVentasQueueRead {
  return presentBoard(tenantId, funnels, stagesByFunnel, funnelFilter, []);
}

export async function getGrowthVentasOperateView(
  tenantId: string,
  oportunidadId: string
): Promise<GrowthVentasOpportunityOperateView | null> {
  const db = await getDatabase();
  const store = createMongoGrowthOpportunityStore(db);
  const oportunidad = await store.findById(tenantId, oportunidadId);
  if (!oportunidad) return null;

  const persona = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .findOne({ tenantId, _id: oportunidad.personaId });
  if (!persona) return null;

  const activityCollection = db.collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION);
  const [activities, stageActivities, conversations] = await Promise.all([
    activityCollection
      .find({ tenantId, oportunidadId })
      .sort({ occurredAt: -1 })
      .limit(50)
      .toArray(),
    activityCollection
      .find({
        tenantId,
        oportunidadId,
        kind: { $in: ["opportunity_opened", "opportunity_transitioned"] },
      })
      .sort({ occurredAt: 1 })
      .toArray(),
    listPersonaConversationViews(tenantId, oportunidad.personaId),
  ]);

  const visible = sortActivitiesNewestFirst(activitiesVisibleInUi(activities));
  const detail = toOportunidadDetailView(oportunidad, persona, visible);
  const { funnels, stagesByFunnel } = await loadFunnelContext(tenantId);
  const config = await resolveGrowthSpaceConfig(store, tenantId);
  const members = await listGrowthSpaceMembers(tenantId);
  const ownerLabel = oportunidad.ownerUserId
    ? members.find((member) => member.userId === oportunidad.ownerUserId)?.label
    : undefined;
  const presented = presentQueueItem(
    oportunidad,
    persona,
    undefined,
    funnels,
    stagesByFunnel,
    new Date(),
    config.staleAfterDays ?? 7,
    ownerLabel
  );
  const funnel = funnels.find(
    (item) => item.tenantId === tenantId && item.key === presented.funnelKey
  );

  let assessment = null;
  const port = getGrowthAssessmentPort(tenantId);
  if (port) {
    try {
      assessment = await port.viewForOpportunity(tenantId, oportunidadId);
    } catch (error) {
      console.error(
        "[Growth] no se pudo leer la evaluación de la oportunidad",
        error instanceof Error ? error.message : error
      );
    }
  }

  return {
    ...detail,
    originLabel: humanizeOriginDisplayLabel(detail.originLabel),
    typeKey: oportunidad.typeKey,
    funnelKey: presented.funnelKey,
    funnelName: presented.funnelName,
    stageLabel: presented.stageLabel,
    statusLabel: presented.stageLabel,
    assessment,
    ownerUserId: oportunidad.ownerUserId,
    ownerLabel,
    funnelFields: presentFunnelFieldRows(funnel?.fields ?? [], oportunidad.customFields),
    availableTransitions: presented.availableTransitions,
    recentActivities: visible.map((activity) => toActivityView(activity)),
    email: persona.email,
    phone: persona.phone,
    closedAt: oportunidad.closedAt,
    organizationName: assessment?.organizationName,
    stageTrack: presentOpportunityStageTrack({
      stages: stagesByFunnel.get(presented.funnelKey) ?? [],
      status: oportunidad.status,
      activities: stageActivities,
    }),
    conversations,
  };
}
