import "server-only";

import type { Filter } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { WorkflowDefinition } from "@/types/workflow";
import {
  SYSTEM_WORKFLOW_TEMPLATES,
  templateToDefinition,
} from "@/core/workflow/definitions/defaults";
import { generateId } from "@/core/identity/auth/crypto";

function definitionTenantFilter(tenantId: string): Filter<WorkflowDefinition> {
  return {
    $or: [{ tenantId }, { tenantId: { $exists: false } }],
  };
}

export async function findDefinitionByKey(
  tenantId: string,
  key: string
): Promise<WorkflowDefinition | null> {
  const db = await getDatabase();
  return db.collection<WorkflowDefinition>("workflow_definitions").findOne({
    key,
    ...definitionTenantFilter(tenantId),
    status: "active",
  });
}

export async function getDefinitionById(id: string): Promise<WorkflowDefinition | null> {
  const db = await getDatabase();
  return db.collection<WorkflowDefinition>("workflow_definitions").findOne({ _id: id });
}

export async function listDefinitions(tenantId: string): Promise<WorkflowDefinition[]> {
  const db = await getDatabase();
  return db
    .collection<WorkflowDefinition>("workflow_definitions")
    .find({
      ...definitionTenantFilter(tenantId),
      status: "active",
    })
    .sort({ entityType: 1, name: 1 })
    .toArray();
}

export async function ensureSystemDefinitions(tenantId: string): Promise<WorkflowDefinition[]> {
  const db = await getDatabase();
  const col = db.collection<WorkflowDefinition>("workflow_definitions");
  const existing = await listDefinitions(tenantId);
  const existingKeys = new Set(existing.map((d) => d.key));

  const now = new Date().toISOString();
  const toInsert: WorkflowDefinition[] = [];

  for (const template of SYSTEM_WORKFLOW_TEMPLATES) {
    if (existingKeys.has(template.key)) continue;
    const def = templateToDefinition(template);
    toInsert.push({
      ...def,
      _id: generateId("wfdef"),
      createdAt: now,
      updatedAt: now,
    });
  }

  if (toInsert.length > 0) {
    await col.insertMany(toInsert);
  }

  return listDefinitions(tenantId);
}
