/**
 * Puerto de Workflow para Oportunidad — reutiliza la plantilla growth.opportunity.
 * No inventa un segundo motor: aplica las mismas transiciones del template de plataforma.
 * El adapter de producción (lib) llama al Workflow Engine real.
 */

import {
  GROWTH_OPPORTUNITY_DEFINITION_KEY,
  GROWTH_OPPORTUNITY_ENTITY_TYPE,
  GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE,
  isGrowthOpportunityFinalStatus,
} from "./opportunity-definition";

export interface GrowthOpportunityWorkflowStartResult {
  instanceId: string;
  currentState: string;
  definitionKey: string;
}

export interface GrowthOpportunityWorkflowTransitionResult {
  instanceId: string;
  fromState: string;
  toState: string;
  completed: boolean;
}

export interface GrowthOpportunityWorkflowPort {
  start(input: {
    tenantId: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<GrowthOpportunityWorkflowStartResult>;

  transition(input: {
    tenantId: string;
    instanceId: string;
    toState?: string;
    transitionId?: string;
    comment?: string;
    metadata?: Record<string, unknown>;
    /** Operador humano o sistema (p. ej. growth-ingest). */
    performedBy?: string;
  }): Promise<GrowthOpportunityWorkflowTransitionResult>;
}

function newInstanceId(): string {
  return `wfinst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Driver en memoria respaldado por la misma plantilla SYSTEM (tests focalizados).
 * Valida transiciones exactamente como la definición de plataforma.
 */
export function createMemoryGrowthOpportunityWorkflow(): GrowthOpportunityWorkflowPort & {
  instances: Map<
    string,
    {
      tenantId: string;
      entityId: string;
      currentState: string;
      status: "active" | "completed";
      history: Array<{ fromState: string; toState: string; at: string }>;
    }
  >;
} {
  const template = GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE;
  const initial =
    template.states.find((s) => s.isInitial)?.key ?? template.states[0].key;
  const instances = new Map<
    string,
    {
      tenantId: string;
      entityId: string;
      currentState: string;
      status: "active" | "completed";
      history: Array<{ fromState: string; toState: string; at: string }>;
    }
  >();

  return {
    instances,

    async start({ tenantId, entityId }) {
      for (const [id, inst] of instances) {
        if (
          inst.tenantId === tenantId &&
          inst.entityId === entityId &&
          inst.status === "active"
        ) {
          return {
            instanceId: id,
            currentState: inst.currentState,
            definitionKey: GROWTH_OPPORTUNITY_DEFINITION_KEY,
          };
        }
      }
      const instanceId = newInstanceId();
      instances.set(instanceId, {
        tenantId,
        entityId,
        currentState: initial,
        status: "active",
        history: [{ fromState: initial, toState: initial, at: new Date().toISOString() }],
      });
      return {
        instanceId,
        currentState: initial,
        definitionKey: GROWTH_OPPORTUNITY_DEFINITION_KEY,
      };
    },

    async transition({
      tenantId,
      instanceId,
      toState,
      transitionId,
    }) {
      const inst = instances.get(instanceId);
      if (!inst || inst.tenantId !== tenantId) {
        throw new Error("Instancia de workflow no encontrada.");
      }
      if (inst.status !== "active") {
        throw new Error("El workflow no está activo.");
      }

      const transitionDef =
        (transitionId
          ? template.transitions.find((t) => t.id === transitionId)
          : undefined) ??
        (toState
          ? template.transitions.find(
              (t) => t.fromState === inst.currentState && t.toState === toState
            )
          : undefined);

      if (!transitionDef || transitionDef.fromState !== inst.currentState) {
        throw new Error("Transición no válida desde el estado actual.");
      }

      const fromState = inst.currentState;
      const next = transitionDef.toState;
      const completed = isGrowthOpportunityFinalStatus(next);
      inst.currentState = next;
      inst.status = completed ? "completed" : "active";
      inst.history.push({
        fromState,
        toState: next,
        at: new Date().toISOString(),
      });

      return {
        instanceId,
        fromState,
        toState: next,
        completed,
      };
    },
  };
}

export { GROWTH_OPPORTUNITY_ENTITY_TYPE, GROWTH_OPPORTUNITY_DEFINITION_KEY };
