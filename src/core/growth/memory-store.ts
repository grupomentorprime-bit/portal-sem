/**
 * Store en memoria para pruebas focalizadas (sin Mongo).
 */

import { createMemoryActivityMap } from "./activity-persist";
import type { GrowthActivity, GrowthPersona } from "./types";
import type { GrowthPersonaStore } from "./store";

export function createMemoryGrowthPersonaStore(): GrowthPersonaStore & {
  personas: Map<string, GrowthPersona>;
  activities: Map<string, GrowthActivity>;
} {
  const personas = new Map<string, GrowthPersona>();
  const activityMap = createMemoryActivityMap();

  function key(tenantId: string, id: string) {
    return `${tenantId}::${id}`;
  }

  return {
    personas,
    activities: activityMap.activities,

    async findByEmail(tenantId, emailNormalized) {
      for (const p of personas.values()) {
        if (p.tenantId === tenantId && p.emailNormalized === emailNormalized)
          return p;
      }
      return null;
    },

    async findByPhone(tenantId, phoneNormalized) {
      for (const p of personas.values()) {
        if (p.tenantId === tenantId && p.phoneNormalized === phoneNormalized)
          return p;
      }
      return null;
    },

    async findById(tenantId, personaId) {
      const p = personas.get(key(tenantId, personaId));
      return p ?? null;
    },

    async insert(persona) {
      personas.set(key(persona.tenantId, persona._id), structuredClone(persona));
      return structuredClone(persona);
    },

    async replace(persona) {
      personas.set(key(persona.tenantId, persona._id), structuredClone(persona));
      return structuredClone(persona);
    },

    recordActivity: activityMap.recordActivity,
    setActivityEventId: activityMap.setActivityEventId,
    findActivityByIngestKey: activityMap.findActivityByIngestKey,
  };
}
