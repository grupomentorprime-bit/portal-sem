/**
 * Persistencia Mongo de growth_oportunidades + growth_space_config + actividades.
 * No modifica identity_users, content_people, portal_interesados ni forms.
 */

import type { Db } from "mongodb";
import {
  findActivityByIngestKeyInCollection,
  insertActivityIdempotent,
  setActivityEventIdInCollection,
} from "./activity-persist";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import { ensureGrowthOpportunityIndexes } from "./indexes";
import type { GrowthOpportunityStore } from "./opportunity-store";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_SPACE_CONFIG_COLLECTION,
  type GrowthActivity,
  type GrowthOportunidad,
  type GrowthSpaceConfig,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthOpportunityStore(db: Db): GrowthOpportunityStore {
  const oportunidades = db.collection<GrowthOportunidad>(
    GROWTH_OPORTUNIDADES_COLLECTION
  );
  const spaceConfigs = db.collection<GrowthSpaceConfig>(
    GROWTH_SPACE_CONFIG_COLLECTION
  );
  const actividades = db.collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION);

  return {
    async findById(tenantId, oportunidadId) {
      return oportunidades.findOne({ tenantId, _id: oportunidadId });
    },

    async listByPersona(tenantId, personaId) {
      return oportunidades
        .find({ tenantId, personaId })
        .sort({ openedAt: -1 })
        .toArray();
    },

    async findOpenBySubject({
      tenantId,
      personaId,
      typeKey,
      subjectType,
      subjectId,
    }) {
      const filter: Record<string, unknown> = {
        tenantId,
        personaId,
        typeKey,
        subjectType,
      };
      if (subjectId) filter.subjectId = subjectId;
      else filter.$or = [{ subjectId: { $exists: false } }, { subjectId: "" }];

      const candidates = await oportunidades.find(filter).toArray();
      return (
        candidates.find((o) => !isGrowthOpportunityFinalStatus(o.status)) ??
        null
      );
    },

    async insert(oportunidad) {
      const doc = omitUndefined({ ...oportunidad }) as GrowthOportunidad;
      await oportunidades.insertOne(doc);
      return doc;
    },

    async replace(oportunidad) {
      const doc = omitUndefined({ ...oportunidad }) as GrowthOportunidad;
      await oportunidades.replaceOne(
        { tenantId: doc.tenantId, _id: doc._id },
        doc
      );
      return doc;
    },

    async getSpaceConfig(tenantId) {
      return spaceConfigs.findOne({ tenantId });
    },

    async upsertSpaceConfig(config) {
      const doc = omitUndefined({ ...config }) as GrowthSpaceConfig;
      await spaceConfigs.replaceOne({ tenantId: doc.tenantId }, doc, {
        upsert: true,
      });
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

    async findBySource(tenantId, sourceCollection, sourceId) {
      return oportunidades.findOne({
        tenantId,
        "source.sourceCollection": sourceCollection,
        "source.sourceId": sourceId,
      });
    },
  };
}

export async function openGrowthOpportunityStore(
  db: Db
): Promise<GrowthOpportunityStore> {
  await ensureGrowthOpportunityIndexes(db);
  return createMongoGrowthOpportunityStore(db);
}
