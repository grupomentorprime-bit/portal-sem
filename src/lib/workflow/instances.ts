import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { WorkflowInstance } from "@/types/workflow";
import { generateId } from "@/core/identity/auth/crypto";

export async function findInstanceByEntity(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<WorkflowInstance | null> {
  const db = await getDatabase();
  return db.collection<WorkflowInstance>("workflow_instances").findOne({
    tenantId,
    entityType,
    entityId,
    status: "active",
  });
}

export async function getInstanceById(id: string): Promise<WorkflowInstance | null> {
  const db = await getDatabase();
  return db.collection<WorkflowInstance>("workflow_instances").findOne({ _id: id });
}

export async function listActiveInstances(tenantId: string): Promise<WorkflowInstance[]> {
  const db = await getDatabase();
  return db
    .collection<WorkflowInstance>("workflow_instances")
    .find({ tenantId, status: "active" })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
}

export async function createInstance(input: {
  tenantId: string;
  entityType: string;
  entityId: string;
  definitionId: string;
  definitionKey: string;
  currentState: string;
}): Promise<WorkflowInstance> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const instance: WorkflowInstance = {
    _id: generateId("wfinst"),
    tenantId: input.tenantId,
    entityType: input.entityType,
    entityId: input.entityId,
    definitionId: input.definitionId,
    definitionKey: input.definitionKey,
    currentState: input.currentState,
    status: "active",
    startedAt: now,
    updatedAt: now,
  };

  await db.collection<WorkflowInstance>("workflow_instances").insertOne(instance);
  return instance;
}

export async function updateInstanceState(
  id: string,
  currentState: string,
  status: WorkflowInstance["status"],
  completedAt?: string
): Promise<WorkflowInstance | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const update: Partial<WorkflowInstance> = {
    currentState,
    status,
    updatedAt: now,
    ...(completedAt ? { completedAt } : {}),
  };

  await db.collection<WorkflowInstance>("workflow_instances").updateOne(
    { _id: id },
    { $set: update }
  );

  return getInstanceById(id);
}
