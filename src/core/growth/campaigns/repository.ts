/**
 * Persistencia Mongo de Campañas (CONTRACT-002).
 */

import type { Db } from "mongodb";
import type { GrowthCampaignStore } from "./store";
import {
  GROWTH_CAMPAIGNS_COLLECTION,
  type GrowthCampaign,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthCampaignStore(db: Db): GrowthCampaignStore {
  const campaigns = db.collection<GrowthCampaign>(GROWTH_CAMPAIGNS_COLLECTION);

  return {
    async insert(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthCampaign;
      await campaigns.insertOne(clean);
      return clean;
    },

    async replace(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthCampaign;
      await campaigns.replaceOne(
        { tenantId: clean.tenantId, _id: clean._id },
        clean
      );
      return clean;
    },

    async findById(tenantId, campaignId) {
      return campaigns.findOne({ tenantId, _id: campaignId });
    },

    async findByTrackingKey(tenantId, trackingKey) {
      return campaigns.findOne({ tenantId, trackingKey });
    },

    async findActiveByFormId(tenantId, formId) {
      return campaigns.findOne({
        tenantId,
        status: "active",
        "source.kind": "form",
        "source.formId": formId,
      });
    },

    async list(tenantId) {
      return campaigns
        .find({ tenantId })
        .sort({ updatedAt: -1 })
        .toArray();
    },
  };
}
