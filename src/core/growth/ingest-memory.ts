/**
 * Harness de memoria para tests de ingestión: Persona + Oportunidad
 * comparten el mismo mapa de actividades (como Mongo en producción).
 */

import { createMemoryActivityMap } from "./activity-persist";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthPersonaStore } from "./store";
import type {
  GrowthActivity,
  GrowthOportunidad,
  GrowthPersona,
  GrowthSpaceConfig,
} from "./types";

function key(tenantId: string, id: string) {
  return `${tenantId}::${id}`;
}

function subjectKey(subjectType: string, subjectId?: string) {
  return `${subjectType}::${subjectId ?? ""}`;
}

export function createMemoryGrowthIngestStores(): {
  personas: GrowthPersonaStore & {
    personas: Map<string, GrowthPersona>;
    activities: Map<string, GrowthActivity>;
  };
  oportunidades: GrowthOpportunityStore & {
    oportunidades: Map<string, GrowthOportunidad>;
    spaceConfigs: Map<string, GrowthSpaceConfig>;
    activities: Map<string, GrowthActivity>;
  };
  activities: Map<string, GrowthActivity>;
} {
  const activityMap = createMemoryActivityMap();
  const personasMap = new Map<string, GrowthPersona>();
  const oportunidadesMap = new Map<string, GrowthOportunidad>();
  const spaceConfigs = new Map<string, GrowthSpaceConfig>();

  const personas: GrowthPersonaStore & {
    personas: Map<string, GrowthPersona>;
    activities: Map<string, GrowthActivity>;
  } = {
    personas: personasMap,
    activities: activityMap.activities,

    async findByEmail(tenantId, emailNormalized) {
      for (const p of personasMap.values()) {
        if (p.tenantId === tenantId && p.emailNormalized === emailNormalized)
          return p;
      }
      return null;
    },

    async findByPhone(tenantId, phoneNormalized) {
      for (const p of personasMap.values()) {
        if (p.tenantId === tenantId && p.phoneNormalized === phoneNormalized)
          return p;
      }
      return null;
    },

    async findById(tenantId, personaId) {
      return personasMap.get(key(tenantId, personaId)) ?? null;
    },

    async insert(persona) {
      personasMap.set(key(persona.tenantId, persona._id), structuredClone(persona));
      return structuredClone(persona);
    },

    async replace(persona) {
      personasMap.set(key(persona.tenantId, persona._id), structuredClone(persona));
      return structuredClone(persona);
    },

    recordActivity: activityMap.recordActivity,
    setActivityEventId: activityMap.setActivityEventId,
    findActivityByIngestKey: activityMap.findActivityByIngestKey,
  };

  const oportunidades: GrowthOpportunityStore & {
    oportunidades: Map<string, GrowthOportunidad>;
    spaceConfigs: Map<string, GrowthSpaceConfig>;
    activities: Map<string, GrowthActivity>;
  } = {
    oportunidades: oportunidadesMap,
    spaceConfigs,
    activities: activityMap.activities,

    async findById(tenantId, oportunidadId) {
      const doc = oportunidadesMap.get(key(tenantId, oportunidadId));
      return doc ? structuredClone(doc) : null;
    },

    async listByPersona(tenantId, personaId) {
      const list: GrowthOportunidad[] = [];
      for (const o of oportunidadesMap.values()) {
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
      for (const o of oportunidadesMap.values()) {
        if (o.tenantId !== tenantId || o.personaId !== personaId) continue;
        if (o.typeKey !== typeKey) continue;
        if (isGrowthOpportunityFinalStatus(o.status)) continue;
        if (subjectKey(o.subjectType, o.subjectId) !== want) continue;
        return structuredClone(o);
      }
      return null;
    },

    async findBySource(tenantId, sourceCollection, sourceId) {
      for (const o of oportunidadesMap.values()) {
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
      oportunidadesMap.set(
        key(oportunidad.tenantId, oportunidad._id),
        structuredClone(oportunidad)
      );
      return structuredClone(oportunidad);
    },

    async replace(oportunidad) {
      oportunidadesMap.set(
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

  return { personas, oportunidades, activities: activityMap.activities };
}
