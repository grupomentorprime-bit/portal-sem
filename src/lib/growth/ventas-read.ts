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
  listAvailableGrowthOpportunityTransitions,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthOpportunityStatus,
  type GrowthPersona,
} from "@/core/growth";
import { getDatabase } from "@/lib/mongodb";
import { humanizeOriginDisplayLabel } from "./humanize-origin-display";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  growthActivityKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginArrivalLabel,
} from "./labels";
import {
  activitiesVisibleInUi,
  escapeGrowthSearchRegex,
  sortActivitiesNewestFirst,
  toActivityView,
  toOportunidadDetailView,
} from "./persona-view";
import type {
  GrowthVentasOpportunityOperateView,
  GrowthVentasQueueItemView,
} from "./ventas-view";

export type {
  GrowthVentasOpportunityOperateView,
  GrowthVentasQueueItemView,
} from "./ventas-view";

export interface GrowthVentasListFilters {
  q?: string;
  status?: string;
  type?: string;
  /** "with" | "without" | "" */
  nextAction?: string;
  limit?: number;
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

export async function listGrowthVentasQueue(
  tenantId: string,
  filters: GrowthVentasListFilters = {}
): Promise<GrowthVentasQueueItemView[]> {
  const db = await getDatabase();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);

  const filter: Filter<GrowthOportunidad> = { tenantId };
  const status = filters.status?.trim();
  const typeKey = filters.type?.trim();
  if (status) filter.status = status as GrowthOpportunityStatus;
  if (typeKey) filter.typeKey = typeKey;

  const nextAction = filters.nextAction?.trim();
  if (nextAction === "with") {
    filter.nextAction = { $ne: null };
  } else if (nextAction === "without") {
    filter.$or = [{ nextAction: null }, { nextAction: { $exists: false } }];
  }

  const q = filters.q?.trim();
  if (q) {
    const personaIds = await personaIdsMatchingSearch(tenantId, q);
    if (personaIds.length === 0) return [];
    filter.personaId = { $in: personaIds };
  }

  const oportunidades = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  if (oportunidades.length === 0) return [];

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

  return oportunidades.map((o) => {
    const persona = personaById.get(o.personaId);
    const last = lastActivityByOpp.get(o._id);
    return {
      id: o._id,
      personaId: o.personaId,
      personaDisplayName: persona?.displayName ?? "Persona",
      originLabel: humanizeOriginDisplayLabel(
        growthOriginArrivalLabel(o.origin)
      ),
      typeLabel: growthOpportunityTypeLabel(o.typeKey),
      typeKey: o.typeKey,
      status: o.status,
      statusLabel: growthOpportunityStatusLabel(o.status),
      nextActionLabel: o.nextAction?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL,
      hasNextAction: Boolean(o.nextAction),
      lastActivityLabel: last
        ? last.summary || growthActivityKindLabel(last.kind)
        : "Sin actividad",
      lastActivityAt: last?.occurredAt,
      updatedAt: o.updatedAt,
    };
  });
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

  const activities = await db
    .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
    .find({ tenantId, oportunidadId })
    .sort({ occurredAt: -1 })
    .limit(50)
    .toArray();

  const visible = sortActivitiesNewestFirst(activitiesVisibleInUi(activities));
  const detail = toOportunidadDetailView(oportunidad, persona, visible);

  return {
    ...detail,
    originLabel: humanizeOriginDisplayLabel(detail.originLabel),
    typeKey: oportunidad.typeKey,
    availableTransitions: listAvailableGrowthOpportunityTransitions(
      oportunidad.status
    ).map((t) => ({
      id: t.id,
      toState: t.toState,
      // Label del estado destino (Ganada, Perdida…), no el nombre interno de la transición.
      label: growthOpportunityStatusLabel(t.toState),
    })),
    recentActivities: visible.map(toActivityView),
  };
}
