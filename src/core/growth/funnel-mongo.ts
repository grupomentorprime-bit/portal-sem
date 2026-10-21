/**
 * Directorio Mongo de embudos. Lecturas y escrituras filtran por tenantId.
 * Retarget de instancia no toca currentState ni workflow_history.
 */

import type { Db } from "mongodb";
import type { GrowthFunnelDirectory } from "./funnel-directory";
import { stagesFromDefinition, workflowStateColor } from "./funnel-stages";
import {
  GROWTH_FUNNELS_COLLECTION,
  type GrowthFunnel,
  type GrowthFunnelDefinition,
} from "./funnel-types";
import { ensureGrowthFunnelIndexes } from "./indexes";
import {
  GROWTH_OPPORTUNITY_ENTITY_TYPE,
  isGrowthOpportunityFinalStatus,
} from "./opportunity-definition";
import {
  GROWTH_OPORTUNIDADES_COLLECTION,
  type GrowthOportunidad,
} from "./types";
import type { WorkflowDefinition } from "@/types/workflow";

function isResultKey(key: string): boolean {
  return key === "won" || key === "lost" || key === "archived" || key === "handed_off";
}

export function createMongoGrowthFunnelDirectory(db: Db): GrowthFunnelDirectory {
  const funnels = db.collection<GrowthFunnel>(GROWTH_FUNNELS_COLLECTION);
  const definitions = db.collection<WorkflowDefinition>("workflow_definitions");
  const oportunidades = db.collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION);
  const instances = db.collection<{
    _id: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    definitionKey: string;
    currentState: string;
  }>("workflow_instances");
  const history = db.collection<{ tenantId: string; workflowInstanceId: string }>(
    "workflow_history"
  );

  return {
    async listFunnels(tenantId) {
      return funnels.find({ tenantId }).toArray();
    },

    async findFunnel(tenantId, key) {
      return funnels.findOne({ tenantId, key });
    },

    async saveFunnel(funnel) {
      await funnels.replaceOne(
        { tenantId: funnel.tenantId, key: funnel.key },
        funnel,
        { upsert: true }
      );
    },

    async getDefinition(tenantId, key) {
      const doc = await definitions.findOne({ tenantId, key });
      if (!doc) return null;
      return {
        _id: doc._id,
        tenantId: doc.tenantId ?? tenantId,
        key: doc.key,
        name: doc.name,
        initialState: doc.initialState,
        version: doc.version,
        states: doc.states.map((state) => ({
          key: state.key,
          label: state.label,
          isInitial: state.isInitial,
          isFinal: state.isFinal,
          metadata: state.metadata,
        })),
        transitions: doc.transitions.map((transition) => ({
          id: transition.id,
          fromState: transition.fromState,
          toState: transition.toState,
          label: transition.label,
        })),
      };
    },

    async saveDefinition(definition) {
      const now = new Date().toISOString();
      const stages = stagesFromDefinition(definition);
      const existing = await definitions.findOne({
        tenantId: definition.tenantId,
        key: definition.key,
      });
      const doc: WorkflowDefinition = {
        _id: existing?._id ?? definition._id,
        tenantId: definition.tenantId,
        key: definition.key,
        name: definition.name,
        description: "Etapas del embudo comercial",
        entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
        version: definition.version,
        initialState: definition.initialState,
        states: definition.states.map((state) => {
          const stage = stages.find((item) => item.key === state.key);
          return {
            id: state.key,
            key: state.key,
            label: state.label,
            type: state.isFinal
              ? state.key === "won"
                ? "published"
                : state.key === "lost"
                  ? "cancelled"
                  : "archived"
              : state.isInitial
                ? "initial"
                : "normal",
            color: stage ? workflowStateColor(stage) : undefined,
            isInitial: state.isInitial,
            isFinal: state.isFinal,
            metadata: state.metadata,
          };
        }),
        transitions: definition.transitions.map((transition) => ({
          id: transition.id,
          fromState: transition.fromState,
          toState: transition.toState,
          label: transition.label,
          actions: ["audit"],
          ...(isResultKey(transition.toState)
            ? { events: ["WorkflowTransitioned"] }
            : {}),
        })),
        status: "active",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await definitions.replaceOne(
        { tenantId: definition.tenantId, key: definition.key },
        doc,
        { upsert: true }
      );
    },

    async listOpportunities(tenantId) {
      return oportunidades.find({ tenantId }).toArray();
    },

    async saveOpportunity(oportunidad) {
      await oportunidades.replaceOne(
        { tenantId: oportunidad.tenantId, _id: oportunidad._id },
        oportunidad
      );
    },

    async countNonFinal(tenantId, funnelKey) {
      const rows = await oportunidades
        .find({ tenantId, funnelKey })
        .project({ status: 1 })
        .toArray();
      return rows.filter((row) => !isGrowthOpportunityFinalStatus(String(row.status))).length;
    },

    async listOpportunityInstances(tenantId) {
      const rows = await instances
        .find({ tenantId, entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE })
        .toArray();
      return Promise.all(
        rows.map(async (row) => ({
          _id: row._id,
          tenantId: row.tenantId,
          entityId: row.entityId,
          definitionKey: row.definitionKey,
          currentState: row.currentState,
          historyCount: await history.countDocuments({
            tenantId,
            workflowInstanceId: row._id,
          }),
        }))
      );
    },

    async retargetInstance(tenantId, instanceId, definitionId, definitionKey) {
      await instances.updateOne(
        { _id: instanceId, tenantId, entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE },
        { $set: { definitionId, definitionKey, updatedAt: new Date().toISOString() } }
      );
    },
  };
}

export async function openGrowthFunnelDirectory(db: Db): Promise<GrowthFunnelDirectory> {
  await ensureGrowthFunnelIndexes(db);
  return createMongoGrowthFunnelDirectory(db);
}
