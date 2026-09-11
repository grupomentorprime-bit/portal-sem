/**
 * Persistencia Mongo de Automatizaciones versionadas (ADR-011).
 * No reutiliza workflow_definitions. Sin ejecución.
 */

import type { Db } from "mongodb";
import type { GrowthAutomationStore } from "./store";
import {
  GROWTH_AUTOMATIONS_COLLECTION,
  GROWTH_AUTOMATION_VERSIONS_COLLECTION,
  type GrowthAutomation,
  type GrowthAutomationVersion,
} from "./types";

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function createMongoGrowthAutomationStore(db: Db): GrowthAutomationStore {
  const automations = db.collection<GrowthAutomation>(
    GROWTH_AUTOMATIONS_COLLECTION
  );
  const versions = db.collection<GrowthAutomationVersion>(
    GROWTH_AUTOMATION_VERSIONS_COLLECTION
  );

  return {
    async insertAutomation(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthAutomation;
      await automations.insertOne(clean);
      return clean;
    },

    async replaceAutomation(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthAutomation;
      await automations.replaceOne(
        { tenantId: clean.tenantId, _id: clean._id },
        clean
      );
      return clean;
    },

    async findAutomationById(tenantId, automationId) {
      return automations.findOne({ tenantId, _id: automationId });
    },

    async listAutomations(tenantId) {
      return automations
        .find({ tenantId })
        .sort({ updatedAt: -1 })
        .toArray();
    },

    async insertVersion(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthAutomationVersion;
      await versions.insertOne(clean);
      return clean;
    },

    async replaceVersion(doc) {
      const clean = omitUndefined({ ...doc }) as GrowthAutomationVersion;
      const result = await versions.replaceOne(
        {
          tenantId: clean.tenantId,
          automationId: clean.automationId,
          version: clean.version,
          status: "draft",
        },
        clean
      );
      if (result.matchedCount === 0) {
        throw new Error("Published or missing automation version cannot be replaced");
      }
      return clean;
    },

    async findVersion(tenantId, automationId, version) {
      return versions.findOne({ tenantId, automationId, version });
    },

    async listVersions(tenantId, automationId) {
      return versions
        .find({ tenantId, automationId })
        .sort({ version: -1 })
        .toArray();
    },
  };
}
