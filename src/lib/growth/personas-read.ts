/**
 * OT-GROWTH-CORE-007 — lectura Mongo tenant-scoped para UI de Personas.
 * Reutiliza stores Core (002/003) donde existen; listado/búsqueda sobre growth_*.
 */

import "server-only";

import type { Db, Filter } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  createMongoGrowthOpportunityStore,
  createMongoGrowthPersonaStore,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthOpportunityStatus,
  type GrowthPersona,
} from "@/core/growth";
import { getDatabase } from "@/lib/mongodb";
import { humanizeOriginDisplayLabel } from "./humanize-origin-display";
import {
  escapeGrowthSearchRegex,
  toOportunidadDetailView,
  toPersonaDetailView,
  toPersonaListItemView,
  type GrowthOportunidadDetailView,
  type GrowthPersonaDetailView,
  type GrowthPersonaListItemView,
} from "./persona-view";

/** Presentación: mismo humanize que Ventas; no toca valores persistidos. */
function presentPersonaListItem(
  view: GrowthPersonaListItemView
): GrowthPersonaListItemView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
  };
}

function presentPersonaDetail(
  view: GrowthPersonaDetailView
): GrowthPersonaDetailView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
    oportunidades: view.oportunidades.map((o) => ({
      ...o,
      originLabel: humanizeOriginDisplayLabel(o.originLabel),
    })),
  };
}

function presentOportunidadDetail(
  view: GrowthOportunidadDetailView
): GrowthOportunidadDetailView {
  return {
    ...view,
    originLabel: humanizeOriginDisplayLabel(view.originLabel),
  };
}

export type {
  GrowthActivityView,
  GrowthNextActionView,
  GrowthOportunidadDetailView,
  GrowthOportunidadView,
  GrowthPersonaDetailView,
  GrowthPersonaListItemView,
} from "./persona-view";

export {
  activitiesVisibleInUi,
  escapeGrowthSearchRegex,
  personaMatchesSearch,
  pickPrimaryNextAction,
  sortActivitiesNewestFirst,
  toActivityView,
  toOportunidadDetailView,
  toOportunidadView,
  toPersonaDetailView,
  toPersonaListItemView,
} from "./persona-view";

export interface GrowthPersonasListFilters {
  q?: string;
  opportunityType?: string;
  opportunityStatus?: GrowthOpportunityStatus | string;
  limit?: number;
}

async function personaIdsMatchingOpportunityFilters(
  db: Db,
  tenantId: string,
  filters: GrowthPersonasListFilters
): Promise<string[] | null> {
  const typeKey = filters.opportunityType?.trim();
  const status = filters.opportunityStatus?.trim();
  if (!typeKey && !status) return null;

  const filter: Filter<GrowthOportunidad> = { tenantId };
  if (typeKey) filter.typeKey = typeKey;
  if (status) filter.status = status as GrowthOpportunityStatus;

  const rows = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find(filter, { projection: { personaId: 1 } })
    .toArray();

  return [...new Set(rows.map((r) => r.personaId))];
}

export async function listGrowthPersonaViews(
  tenantId: string,
  filters: GrowthPersonasListFilters = {}
): Promise<GrowthPersonaListItemView[]> {
  const db = await getDatabase();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);

  const opportunityPersonaIds = await personaIdsMatchingOpportunityFilters(
    db,
    tenantId,
    filters
  );
  if (opportunityPersonaIds && opportunityPersonaIds.length === 0) {
    return [];
  }

  const personaFilter: Filter<GrowthPersona> = {
    tenantId,
    status: { $ne: "merged" },
  };
  if (opportunityPersonaIds) {
    personaFilter._id = { $in: opportunityPersonaIds };
  }

  const q = filters.q?.trim();
  if (q) {
    const rx = new RegExp(escapeGrowthSearchRegex(q), "i");
    personaFilter.$or = [
      { displayName: rx },
      { email: rx },
      { phone: rx },
      { emailNormalized: rx },
      { phoneNormalized: rx },
    ];
  }

  const personas = await db
    .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
    .find(personaFilter)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  if (personas.length === 0) return [];

  const ids = personas.map((p) => p._id);
  const oportunidades = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find({ tenantId, personaId: { $in: ids } })
    .toArray();

  const byPersona = new Map<string, GrowthOportunidad[]>();
  for (const o of oportunidades) {
    const list = byPersona.get(o.personaId) ?? [];
    list.push(o);
    byPersona.set(o.personaId, list);
  }

  return personas.map((p) =>
    presentPersonaListItem(toPersonaListItemView(p, byPersona.get(p._id) ?? []))
  );
}

export async function getGrowthPersonaDetailView(
  tenantId: string,
  personaId: string
): Promise<GrowthPersonaDetailView | null> {
  const db = await getDatabase();
  const personas = createMongoGrowthPersonaStore(db);
  const oportunidadesStore = createMongoGrowthOpportunityStore(db);

  const persona = await personas.findById(tenantId, personaId);
  if (!persona) return null;

  const [oportunidades, activities] = await Promise.all([
    oportunidadesStore.listByPersona(tenantId, personaId),
    db
      .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
      .find({ tenantId, personaId })
      .sort({ occurredAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  return presentPersonaDetail(
    toPersonaDetailView(persona, oportunidades, activities)
  );
}

/**
 * Detalle de Oportunidad del Espacio activo.
 * Devuelve null si el id no existe en este tenant (p. ej. ID de otro Espacio).
 */
export async function getGrowthOportunidadDetailView(
  tenantId: string,
  oportunidadId: string
): Promise<GrowthOportunidadDetailView | null> {
  const db = await getDatabase();
  const personas = createMongoGrowthPersonaStore(db);
  const oportunidades = createMongoGrowthOpportunityStore(db);

  const oportunidad = await oportunidades.findById(tenantId, oportunidadId);
  if (!oportunidad) return null;

  const persona = await personas.findById(tenantId, oportunidad.personaId);
  if (!persona) return null;

  const activities = await db
    .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
    .find({ tenantId, oportunidadId })
    .sort({ occurredAt: -1 })
    .limit(100)
    .toArray();

  return presentOportunidadDetail(
    toOportunidadDetailView(oportunidad, persona, activities)
  );
}
