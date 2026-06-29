import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { WorkflowHistoryEntry } from "@/types/workflow";
import { generateId } from "@/core/identity/auth/crypto";

export async function appendHistory(input: {
  workflowInstanceId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  definitionId: string;
  fromState: string;
  toState: string;
  performedBy: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}): Promise<WorkflowHistoryEntry> {
  const db = await getDatabase();
  const entry: WorkflowHistoryEntry = {
    _id: generateId("wfhist"),
    workflowInstanceId: input.workflowInstanceId,
    tenantId: input.tenantId,
    entityType: input.entityType,
    entityId: input.entityId,
    definitionId: input.definitionId,
    fromState: input.fromState,
    toState: input.toState,
    performedBy: input.performedBy,
    performedAt: new Date().toISOString(),
    comment: input.comment,
    metadata: input.metadata,
  };

  await db.collection<WorkflowHistoryEntry>("workflow_history").insertOne(entry);
  return entry;
}

export async function getHistoryByInstance(
  instanceId: string
): Promise<WorkflowHistoryEntry[]> {
  const db = await getDatabase();
  return db
    .collection<WorkflowHistoryEntry>("workflow_history")
    .find({ workflowInstanceId: instanceId })
    .sort({ performedAt: -1 })
    .toArray();
}

export async function listRecentHistory(
  tenantId: string,
  limit = 50
): Promise<WorkflowHistoryEntry[]> {
  const db = await getDatabase();
  return db
    .collection<WorkflowHistoryEntry>("workflow_history")
    .find({ tenantId })
    .sort({ performedAt: -1 })
    .limit(limit)
    .toArray();
}
