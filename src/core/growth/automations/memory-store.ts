/**
 * Store en memoria para pruebas (sin Mongo, sin ejecución).
 */

import type { GrowthAutomationStore } from "./store";
import type { GrowthAutomation, GrowthAutomationVersion } from "./types";

function autoKey(tenantId: string, id: string) {
  return `${tenantId}::${id}`;
}

function versionKey(tenantId: string, automationId: string, version: number) {
  return `${tenantId}::${automationId}::${version}`;
}

export function createMemoryGrowthAutomationStore(): GrowthAutomationStore & {
  automations: Map<string, GrowthAutomation>;
  versions: Map<string, GrowthAutomationVersion>;
} {
  const automations = new Map<string, GrowthAutomation>();
  const versions = new Map<string, GrowthAutomationVersion>();

  return {
    automations,
    versions,

    async insertAutomation(doc) {
      const key = autoKey(doc.tenantId, doc._id);
      if (automations.has(key)) {
        throw new Error("Automation already exists");
      }
      if (doc.seedKey) {
        const clash = [...automations.values()].find(
          (a) => a.tenantId === doc.tenantId && a.seedKey === doc.seedKey
        );
        if (clash) {
          const err = new Error("Duplicate automation seedKey");
          (err as { code?: number }).code = 11000;
          throw err;
        }
      }
      const clone = structuredClone(doc);
      automations.set(key, clone);
      return structuredClone(clone);
    },

    async replaceAutomation(doc) {
      const key = autoKey(doc.tenantId, doc._id);
      if (!automations.has(key)) {
        throw new Error("Automation not found");
      }
      if (doc.seedKey) {
        const clash = [...automations.values()].find(
          (a) =>
            a.tenantId === doc.tenantId &&
            a.seedKey === doc.seedKey &&
            a._id !== doc._id
        );
        if (clash) {
          const err = new Error("Duplicate automation seedKey");
          (err as { code?: number }).code = 11000;
          throw err;
        }
      }
      const clone = structuredClone(doc);
      automations.set(key, clone);
      return structuredClone(clone);
    },

    async findAutomationById(tenantId, automationId) {
      const doc = automations.get(autoKey(tenantId, automationId));
      return doc ? structuredClone(doc) : null;
    },

    async findAutomationBySeedKey(tenantId, seedKey) {
      const doc = [...automations.values()].find(
        (a) => a.tenantId === tenantId && a.seedKey === seedKey
      );
      return doc ? structuredClone(doc) : null;
    },

    async listAutomations(tenantId) {
      return [...automations.values()]
        .filter((a) => a.tenantId === tenantId)
        .map((a) => structuredClone(a))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async insertVersion(doc) {
      const key = versionKey(doc.tenantId, doc.automationId, doc.version);
      if (versions.has(key)) {
        throw new Error("Automation version already exists");
      }
      const clone = structuredClone(doc);
      versions.set(key, clone);
      return structuredClone(clone);
    },

    async replaceVersion(doc) {
      const key = versionKey(doc.tenantId, doc.automationId, doc.version);
      const existing = versions.get(key);
      if (!existing) throw new Error("Automation version not found");
      if (existing.tenantId !== doc.tenantId) {
        throw new Error("tenant mismatch");
      }
      const clone = structuredClone(doc);
      versions.set(key, clone);
      return structuredClone(clone);
    },

    async findVersion(tenantId, automationId, version) {
      const doc = versions.get(versionKey(tenantId, automationId, version));
      return doc ? structuredClone(doc) : null;
    },

    async listVersions(tenantId, automationId) {
      return [...versions.values()]
        .filter(
          (v) => v.tenantId === tenantId && v.automationId === automationId
        )
        .map((v) => structuredClone(v))
        .sort((a, b) => b.version - a.version);
    },
  };
}
