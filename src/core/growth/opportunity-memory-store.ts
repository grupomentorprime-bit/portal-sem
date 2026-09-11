/**
 * Store en memoria de Oportunidad / space config / actividades (tests).
 */

import { createMemoryActivityMap } from "./activity-persist";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type {
  GrowthActivity,
  GrowthOportunidad,
  GrowthSpaceConfig,
} from "./types";

function key(tenantId: string, id: string) {
  return `${tenantId}::${id}`;
}

function subjectKey(subjectType: string, subjectId?: string) {
  return `${subjectType}::${subjectId ?? ""}`;
}

export function createMemoryGrowthOpportunityStore(): GrowthOpportunityStore & {
  oportunidades: Map<string, GrowthOportunidad>;
  spaceConfigs: Map<string, GrowthSpaceConfig>;
  activities: Map<string, GrowthActivity>;
} {
  const oportunidades = new Map<string, GrowthOportunidad>();
  const spaceConfigs = new Map<string, GrowthSpaceConfig>();
  const activityMap = createMemoryActivityMap();

  return {
    oportunidades,
    spaceConfigs,
    activities: activityMap.activities,

    async findById(tenantId, oportunidadId) {
      const doc = oportunidades.get(key(tenantId, oportunidadId));
      return doc ? structuredClone(doc) : null;
    },

    async listByPersona(tenantId, personaId) {
      const list: GrowthOportunidad[] = [];
      for (const o of oportunidades.values()) {
        if (o.tenantId === tenantId && o.personaId === personaId) {
          list.push(structuredClone(o));
        }
      }
      return list;
    },

    async findOpenBySubject({
      tenantId,
      personaId,
      typeKey,
      subjectType,
      subjectId,
    }) {
      const want = subjectKey(subjectType, subjectId);
      for (const o of oportunidades.values()) {
        if (o.tenantId !== tenantId || o.personaId !== personaId) continue;
        if (o.typeKey !== typeKey) continue;
        if (isGrowthOpportunityFinalStatus(o.status)) continue;
        if (subjectKey(o.subjectType, o.subjectId) !== want) continue;
        return structuredClone(o);
      }
      return null;
    },

    async findBySource(tenantId, sourceCollection, sourceId) {
      for (const o of oportunidades.values()) {
        if (
          o.tenantId === tenantId &&
          o.source.sourceCollection === sourceCollection &&
          o.source.sourceId === sourceId
        ) {
          return structuredClone(o);
        }
      }
      return null;
    },

    async insert(oportunidad) {
      oportunidades.set(
        key(oportunidad.tenantId, oportunidad._id),
        structuredClone(oportunidad)
      );
      return structuredClone(oportunidad);
    },

    async replace(oportunidad) {
      oportunidades.set(
        key(oportunidad.tenantId, oportunidad._id),
        structuredClone(oportunidad)
      );
      return structuredClone(oportunidad);
    },

    async getSpaceConfig(tenantId) {
      const doc = spaceConfigs.get(tenantId);
      return doc ? structuredClone(doc) : null;
    },

    async upsertSpaceConfig(config) {
      spaceConfigs.set(config.tenantId, structuredClone(config));
      return structuredClone(config);
    },

    recordActivity: activityMap.recordActivity,
    setActivityEventId: activityMap.setActivityEventId,
    findActivityByIngestKey: activityMap.findActivityByIngestKey,
  };
}
