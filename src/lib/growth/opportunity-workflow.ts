/**
 * OT-GROWTH-CORE-005 — Workflow port de producción para Oportunidad.
 * Usa instancias/definiciones del motor ADR-005 sin exigir sesión de operador
 * (captación pública: admisión / Experience Forms).
 */

import "server-only";

import {
  GROWTH_OPPORTUNITY_DEFINITION_KEY,
  GROWTH_OPPORTUNITY_ENTITY_TYPE,
  isGrowthOpportunityFinalStatus,
  type GrowthOpportunityWorkflowPort,
} from "@/core/growth";
import {
  ensureSystemDefinitions,
  findDefinitionByKey,
} from "@/lib/workflow/definitions";
import { appendHistory } from "@/lib/workflow/history";
import {
  createInstance,
  findInstanceByEntity,
  getInstanceById,
  updateInstanceState,
} from "@/lib/workflow/instances";

const SYSTEM_ACTOR = "growth-ingest";

export function createMongoGrowthOpportunityWorkflow(): GrowthOpportunityWorkflowPort {
  return {
    async start({ tenantId, entityId, metadata }) {
      await ensureSystemDefinitions(tenantId);
      const existing = await findInstanceByEntity(
        tenantId,
        GROWTH_OPPORTUNITY_ENTITY_TYPE,
        entityId
      );
      if (existing) {
        return {
          instanceId: existing._id,
          currentState: existing.currentState,
          definitionKey: existing.definitionKey,
        };
      }

      const definition = await findDefinitionByKey(
        tenantId,
        GROWTH_OPPORTUNITY_DEFINITION_KEY
      );
      if (!definition) {
        throw new Error(
          `Definición de workflow no encontrada: ${GROWTH_OPPORTUNITY_DEFINITION_KEY}`
        );
      }

      const instance = await createInstance({
        tenantId,
        entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
        entityId,
        definitionId: definition._id,
        definitionKey: definition.key,
        currentState: definition.initialState,
      });

      await appendHistory({
        workflowInstanceId: instance._id,
        tenantId,
        entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
        entityId,
        definitionId: definition._id,
        fromState: definition.initialState,
        toState: definition.initialState,
        performedBy: SYSTEM_ACTOR,
        metadata: { event: "WorkflowStarted", ...(metadata ?? {}) },
      });

      return {
        instanceId: instance._id,
        currentState: instance.currentState,
        definitionKey: instance.definitionKey,
      };
    },

    async transition({
      tenantId,
      instanceId,
      toState,
      transitionId,
      comment,
      metadata,
      performedBy,
    }) {
      const instance = await getInstanceById(instanceId, tenantId);
      if (!instance || instance.status !== "active") {
        throw new Error("Instancia de workflow no encontrada o inactiva.");
      }

      const definition = await findDefinitionByKey(
        tenantId,
        instance.definitionKey
      );
      if (!definition) {
        throw new Error(`Definición no encontrada: ${instance.definitionKey}`);
      }

      const transitionDef =
        (transitionId
          ? definition.transitions.find((t) => t.id === transitionId)
          : undefined) ??
        (toState
          ? definition.transitions.find(
              (t) =>
                t.fromState === instance.currentState && t.toState === toState
            )
          : undefined);

      if (!transitionDef || transitionDef.fromState !== instance.currentState) {
        throw new Error("Transición no válida desde el estado actual.");
      }

      const fromState = instance.currentState;
      const next = transitionDef.toState;
      const completed = isGrowthOpportunityFinalStatus(next);

      await updateInstanceState(
        instance._id,
        tenantId,
        next,
        completed ? "completed" : "active",
        completed ? new Date().toISOString() : undefined
      );

      await appendHistory({
        workflowInstanceId: instance._id,
        tenantId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        definitionId: definition._id,
        fromState,
        toState: next,
        performedBy: performedBy?.trim() || SYSTEM_ACTOR,
        comment,
        metadata,
      });

      return {
        instanceId: instance._id,
        fromState,
        toState: next,
        completed,
      };
    },
  };
}
