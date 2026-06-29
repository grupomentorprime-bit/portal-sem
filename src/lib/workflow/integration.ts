import "server-only";

import type { AuthContext } from "@/types/identity";
import { buildExecutionContext } from "@/core/workflow";
import { startWorkflow, transition } from "@/core/workflow/engine/engine";
import { findDefinitionByKey, ensureSystemDefinitions } from "@/lib/workflow/definitions";
import { findInstanceByEntity } from "@/lib/workflow/instances";

/** Mapeo progresivo entityType → definitionKey */
const ENTITY_WORKFLOW_KEYS: Record<string, string> = {
  "cms.page": "cms.page",
  "academy.program": "academy.program",
  "content.news": "content.news",
};

export async function ensureEntityWorkflow(
  ctx: ReturnType<typeof buildExecutionContext>,
  entityType: string,
  entityId: string
): Promise<void> {
  await ensureSystemDefinitions(ctx.tenant);
  const key = ENTITY_WORKFLOW_KEYS[entityType];
  if (!key) return;

  const existing = await findInstanceByEntity(ctx.tenant, entityType, entityId);
  if (existing) return;

  await startWorkflow(ctx, { definitionKey: key, entityType, entityId });
}

export function mapPageStatusToWorkflowState(status: string): string | null {
  const map: Record<string, string> = {
    draft: "draft",
    published: "published",
    scheduled: "approved",
    archived: "archived",
  };
  return map[status] ?? null;
}

export async function syncPageWorkflow(
  auth: AuthContext,
  pageId: string,
  status: string
): Promise<void> {
  const ctx = buildExecutionContext(auth);
  const targetState = mapPageStatusToWorkflowState(status);
  if (!targetState) return;

  await ensureEntityWorkflow(ctx, "cms.page", pageId);

  const instance = await findInstanceByEntity(ctx.tenant, "cms.page", pageId);
  if (!instance || instance.currentState === targetState) return;

  const definition = await findDefinitionByKey(ctx.tenant, "cms.page");
  const hasTransition = definition?.transitions.some(
    (t) => t.fromState === instance.currentState && t.toState === targetState
  );

  if (hasTransition) {
    await transition(ctx, {
      instanceId: instance._id,
      toState: targetState,
      comment: `Sincronizado desde CMS status: ${status}`,
    });
  }
}
