/**
 * Persistencia de embudos, definiciones de workflow y oportunidades del Espacio.
 * La definición es la lista de etapas. El historial de workflow no se reescribe.
 */

import type { GrowthOportunidad } from "./types";
import type { GrowthFunnel, GrowthFunnelDefinition } from "./funnel-types";

export interface GrowthWorkflowInstanceRef {
  _id: string;
  tenantId: string;
  entityId: string;
  definitionKey: string;
  currentState: string;
  historyCount: number;
}

export interface GrowthFunnelDirectory {
  listFunnels(tenantId: string): Promise<GrowthFunnel[]>;
  findFunnel(tenantId: string, key: string): Promise<GrowthFunnel | null>;
  saveFunnel(funnel: GrowthFunnel): Promise<void>;
  getDefinition(tenantId: string, key: string): Promise<GrowthFunnelDefinition | null>;
  saveDefinition(definition: GrowthFunnelDefinition): Promise<void>;
  listOpportunities(tenantId: string): Promise<GrowthOportunidad[]>;
  saveOpportunity(oportunidad: GrowthOportunidad): Promise<void>;
  countNonFinal(tenantId: string, funnelKey: string): Promise<number>;
  listOpportunityInstances(tenantId: string): Promise<GrowthWorkflowInstanceRef[]>;
  retargetInstance(
    tenantId: string,
    instanceId: string,
    definitionId: string,
    definitionKey: string
  ): Promise<void>;
}
