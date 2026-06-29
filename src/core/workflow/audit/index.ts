import "server-only";

import { writeAudit } from "@/lib/identity/audit";

export async function writeWorkflowAudit(input: {
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  workflowId: string;
  definitionId: string;
  fromState: string;
  toState: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeAudit({
    tenantId: input.tenantId,
    userId: input.userId,
    action: "workflow.transition",
    entity: input.entityType,
    entityId: input.entityId,
    metadata: {
      workflowId: input.workflowId,
      definitionId: input.definitionId,
      fromState: input.fromState,
      toState: input.toState,
      comment: input.comment,
      ...input.metadata,
    },
  });
}
