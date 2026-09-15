/**
 * Store en memoria para pruebas (sin Mongo).
 */

import type { GrowthCampaignStore } from "./store";
import type { GrowthCampaign } from "./types";

function key(tenantId: string, id: string) {
  return `${tenantId}::${id}`;
}

export function createMemoryGrowthCampaignStore(): GrowthCampaignStore & {
  campaigns: Map<string, GrowthCampaign>;
} {
  const campaigns = new Map<string, GrowthCampaign>();

  return {
    campaigns,

    async insert(doc) {
      const k = key(doc.tenantId, doc._id);
      if (campaigns.has(k)) {
        throw new Error("Campaign already exists");
      }
      for (const existing of campaigns.values()) {
        if (
          existing.tenantId === doc.tenantId &&
          existing.trackingKey === doc.trackingKey
        ) {
          const err = new Error("Duplicate trackingKey") as Error & {
            code: number;
          };
          err.code = 11000;
          throw err;
        }
        if (
          doc.status === "active" &&
          doc.source.kind === "form" &&
          existing.status === "active" &&
          existing.source.kind === "form" &&
          existing.tenantId === doc.tenantId &&
          existing.source.formId === doc.source.formId
        ) {
          const err = new Error("Duplicate active form campaign") as Error & {
            code: number;
          };
          err.code = 11000;
          throw err;
        }
      }
      const clone = structuredClone(doc);
      campaigns.set(k, clone);
      return structuredClone(clone);
    },

    async replace(doc) {
      const k = key(doc.tenantId, doc._id);
      if (!campaigns.has(k)) {
        throw new Error("Campaign not found");
      }
      for (const existing of campaigns.values()) {
        if (existing._id === doc._id) continue;
        if (
          existing.tenantId === doc.tenantId &&
          existing.trackingKey === doc.trackingKey
        ) {
          const err = new Error("Duplicate trackingKey") as Error & {
            code: number;
          };
          err.code = 11000;
          throw err;
        }
        if (
          doc.status === "active" &&
          doc.source.kind === "form" &&
          existing.status === "active" &&
          existing.source.kind === "form" &&
          existing.tenantId === doc.tenantId &&
          existing.source.formId === doc.source.formId
        ) {
          const err = new Error("Duplicate active form campaign") as Error & {
            code: number;
          };
          err.code = 11000;
          throw err;
        }
      }
      const clone = structuredClone(doc);
      campaigns.set(k, clone);
      return structuredClone(clone);
    },

    async findById(tenantId, campaignId) {
      const doc = campaigns.get(key(tenantId, campaignId));
      return doc ? structuredClone(doc) : null;
    },

    async findByTrackingKey(tenantId, trackingKey) {
      for (const doc of campaigns.values()) {
        if (doc.tenantId === tenantId && doc.trackingKey === trackingKey) {
          return structuredClone(doc);
        }
      }
      return null;
    },

    async findActiveByFormId(tenantId, formId) {
      for (const doc of campaigns.values()) {
        if (
          doc.tenantId === tenantId &&
          doc.status === "active" &&
          doc.source.kind === "form" &&
          doc.source.formId === formId
        ) {
          return structuredClone(doc);
        }
      }
      return null;
    },

    async list(tenantId) {
      return [...campaigns.values()]
        .filter((c) => c.tenantId === tenantId)
        .map((c) => structuredClone(c))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
  };
}
