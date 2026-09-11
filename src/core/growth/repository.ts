/**
 * Persistencia Mongo de growth_personas + growth_actividades (modelo definitivo).
 * No modifica identity_users, content_people ni portal_interesados.
 */

import type { Db } from "mongodb";
import {
  findActivityByIngestKeyInCollection,
  insertActivityIdempotent,
  setActivityEventIdInCollection,
} from "./activity-persist";
import { ensureGrowthPersonaIndexes } from "./indexes";
import type { GrowthPersonaStore } from "./store";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  type GrowthActivity,
  type GrowthPersona,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthPersonaStore(db: Db): GrowthPersonaStore {
  const personas = db.collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION);
  const actividades = db.collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION);

  return {
    async findByEmail(tenantId, emailNormalized) {
      return personas.findOne({ tenantId, emailNormalized });
    },

    async findByPhone(tenantId, phoneNormalized) {
      return personas.findOne({ tenantId, phoneNormalized });
    },

    async findById(tenantId, personaId) {
      return personas.findOne({ tenantId, _id: personaId });
    },

    async insert(persona) {
      const doc = omitUndefined({ ...persona }) as GrowthPersona;
      await personas.insertOne(doc);
      return doc;
    },

    async replace(persona) {
      const doc = omitUndefined({ ...persona }) as GrowthPersona;
      await personas.replaceOne({ tenantId: doc.tenantId, _id: doc._id }, doc);
      return doc;
    },

    async recordActivity(activity) {
      return insertActivityIdempotent(actividades, activity);
    },

    async setActivityEventId(tenantId, activityId, eventId) {
      return setActivityEventIdInCollection(
        actividades,
        tenantId,
        activityId,
        eventId
      );
    },

    async findActivityByIngestKey(tenantId, ingestKey) {
      return findActivityByIngestKeyInCollection(
        actividades,
        tenantId,
        ingestKey
      );
    },
  };
}

/** Asegura índices y retorna store listo para upsert. */
export async function openGrowthPersonaStore(db: Db): Promise<GrowthPersonaStore> {
  await ensureGrowthPersonaIndexes(db);
  return createMongoGrowthPersonaStore(db);
}
