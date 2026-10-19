/**
 * Directorio de embudos en memoria. Aísla por tenantId.
 */

import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import type {
  GrowthFunnelDirectory,
  GrowthWorkflowInstanceRef,
} from "./funnel-directory";
import type { GrowthFunnel, GrowthFunnelDefinition } from "./funnel-types";
import type { GrowthOportunidad } from "./types";

export interface MemoryFunnelWorkflow {
  instances: Map<
    string,
    {
      tenantId: string;
      entityId: string;
      currentState: string;
      definitionKey?: string;
      status: "active" | "completed";
      history: Array<{ fromState: string; toState: string; at: string }>;
    }
  >;
  installDefinition?: (definition: GrowthFunnelDefinition) => void;
}

export function createMemoryFunnelDirectory(input?: {
  opportunities?: Map<string, GrowthOportunidad>;
  workflow?: MemoryFunnelWorkflow;
}): GrowthFunnelDirectory & {
  funnels: GrowthFunnel[];
  definitions: GrowthFunnelDefinition[];
} {
  const funnels: GrowthFunnel[] = [];
  const definitions: GrowthFunnelDefinition[] = [];
  const opportunities = input?.opportunities ?? new Map<string, GrowthOportunidad>();

  return {
    funnels,
    definitions,

    async listFunnels(tenantId) {
      return funnels
        .filter((funnel) => funnel.tenantId === tenantId)
        .map((funnel) => structuredClone(funnel));
    },

    async findFunnel(tenantId, key) {
      const found = funnels.find(
        (funnel) => funnel.tenantId === tenantId && funnel.key === key
      );
      return found ? structuredClone(found) : null;
    },

    async saveFunnel(funnel) {
      const index = funnels.findIndex(
        (item) => item.tenantId === funnel.tenantId && item.key === funnel.key
      );
      if (index >= 0) funnels[index] = structuredClone(funnel);
      else funnels.push(structuredClone(funnel));
    },

    async getDefinition(tenantId, key) {
      const found = definitions.find(
        (item) => item.tenantId === tenantId && item.key === key
      );
      return found ? structuredClone(found) : null;
    },

    async saveDefinition(definition) {
      const index = definitions.findIndex(
        (item) => item.tenantId === definition.tenantId && item.key === definition.key
      );
      if (index >= 0) definitions[index] = structuredClone(definition);
      else definitions.push(structuredClone(definition));
      input?.workflow?.installDefinition?.(definition);
    },

    async listOpportunities(tenantId) {
      return [...opportunities.values()]
        .filter((item) => item.tenantId === tenantId)
        .map((item) => structuredClone(item));
    },

    async saveOpportunity(oportunidad) {
      const key = `${oportunidad.tenantId}::${oportunidad._id}`;
      opportunities.set(key, structuredClone(oportunidad));
    },

    async countNonFinal(tenantId, funnelKey) {
      let count = 0;
      for (const item of opportunities.values()) {
        if (item.tenantId !== tenantId) continue;
        if ((item.funnelKey || "default") !== funnelKey) continue;
        if (!isGrowthOpportunityFinalStatus(item.status)) count += 1;
      }
      return count;
    },

    async listOpportunityInstances(tenantId) {
      const refs: GrowthWorkflowInstanceRef[] = [];
      for (const [id, instance] of input?.workflow?.instances ?? []) {
        if (instance.tenantId !== tenantId) continue;
        refs.push({
          _id: id,
          tenantId: instance.tenantId,
          entityId: instance.entityId,
          definitionKey: instance.definitionKey ?? "growth.opportunity",
          currentState: instance.currentState,
          historyCount: instance.history.length,
        });
      }
      return refs;
    },

    async retargetInstance(tenantId, instanceId, _definitionId, definitionKey) {
      const instance = input?.workflow?.instances.get(instanceId);
      if (!instance || instance.tenantId !== tenantId) return;
      instance.definitionKey = definitionKey;
    },
  };
}
