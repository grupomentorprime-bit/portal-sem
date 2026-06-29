import type { ExecutionContext, WorkflowInstance } from "@/types/workflow";
import type { WorkflowTransition } from "@/types/workflow";

export type WorkflowActionHandler = (input: {
  ctx: ExecutionContext;
  instance: WorkflowInstance;
  transition: WorkflowTransition;
  comment?: string;
  metadata?: Record<string, unknown>;
}) => Promise<void>;

const actionRegistry = new Map<string, WorkflowActionHandler>();

export function registerAction(key: string, handler: WorkflowActionHandler): void {
  actionRegistry.set(key, handler);
}

export async function runActions(
  actionKeys: string[] | undefined,
  input: {
    ctx: ExecutionContext;
    instance: WorkflowInstance;
    transition: WorkflowTransition;
    comment?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  if (!actionKeys?.length) return;
  for (const key of actionKeys) {
    const handler = actionRegistry.get(key);
    if (handler) await handler(input);
  }
}

registerAction("audit", async ({ ctx, instance, transition, comment, metadata }) => {
  const { writeWorkflowAudit } = await import("@/core/workflow/audit");
  await writeWorkflowAudit({
    tenantId: ctx.tenant,
    userId: ctx.user._id,
    entityType: instance.entityType,
    entityId: instance.entityId,
    workflowId: instance._id,
    definitionId: instance.definitionId,
    fromState: transition.fromState,
    toState: transition.toState,
    comment,
    metadata,
  });
});

registerAction("notify", async () => {
  /* placeholder — integración futura con notifications core */
});
