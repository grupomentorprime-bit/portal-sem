import "server-only";

import type {
  ExecutionContext,
  StartWorkflowInput,
  TransitionWorkflowInput,
  WorkflowDefinition,
  WorkflowDomainEvent,
  WorkflowInstance,
  WorkflowTransition,
} from "@/types/workflow";
import { authorizeOrThrow } from "@/core/identity";
import { evaluateGuard, canTransitionGuard } from "@/core/workflow/guards";
import { runActions } from "@/core/workflow/actions/registry";
import { publish, publishTransitionEvents } from "@/core/workflow/events/bus";
import {
  findDefinitionByKey,
  getDefinitionById,
} from "@/lib/workflow/definitions";
import {
  createInstance,
  findInstanceByEntity,
  getInstanceById,
  updateInstanceState,
} from "@/lib/workflow/instances";
import { appendHistory, getHistoryByInstance } from "@/lib/workflow/history";

function authFromContext(ctx: ExecutionContext) {
  return {
    user: ctx.user,
    session: ctx.session,
    membership: ctx.membership,
    permissions: ctx.permissions,
    tenantId: ctx.tenant,
    compatMode: ctx.compatMode,
  };
}

function findTransition(
  definition: WorkflowDefinition,
  input: { transitionId?: string; toState?: string; fromState: string }
): WorkflowTransition | null {
  if (input.transitionId) {
    return definition.transitions.find((t) => t.id === input.transitionId) ?? null;
  }
  if (input.toState) {
    return (
      definition.transitions.find(
        (t) => t.fromState === input.fromState && t.toState === input.toState
      ) ?? null
    );
  }
  return null;
}

function isFinalState(definition: WorkflowDefinition, stateKey: string): boolean {
  const state = definition.states.find((s) => s.key === stateKey);
  return Boolean(state?.isFinal);
}

export async function startWorkflow(
  ctx: ExecutionContext,
  input: StartWorkflowInput
): Promise<WorkflowInstance> {
  authorizeOrThrow(authFromContext(ctx), "workflow.transition");

  const existing = await findInstanceByEntity(ctx.tenant, input.entityType, input.entityId);
  if (existing) return existing;

  const definition = await findDefinitionByKey(ctx.tenant, input.definitionKey);
  if (!definition) {
    throw new Error(`Definición de workflow no encontrada: ${input.definitionKey}`);
  }

  const instance = await createInstance({
    tenantId: ctx.tenant,
    entityType: input.entityType,
    entityId: input.entityId,
    definitionId: definition._id,
    definitionKey: definition.key,
    currentState: definition.initialState,
  });

  await appendHistory({
    workflowInstanceId: instance._id,
    tenantId: ctx.tenant,
    entityType: input.entityType,
    entityId: input.entityId,
    definitionId: definition._id,
    fromState: definition.initialState,
    toState: definition.initialState,
    performedBy: ctx.user._id,
    metadata: { event: "WorkflowStarted", ...input.metadata },
  });

  const event: WorkflowDomainEvent = {
    type: "WorkflowStarted",
    tenantId: ctx.tenant,
    entityType: input.entityType,
    entityId: input.entityId,
    workflowInstanceId: instance._id,
    definitionId: definition._id,
    toState: definition.initialState,
    performedBy: ctx.user._id,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
  };
  await publish(event);

  return instance;
}

export async function canTransition(
  ctx: ExecutionContext,
  instanceId: string,
  transitionId: string
): Promise<boolean> {
  const instance = await getInstanceById(instanceId);
  if (!instance || instance.status !== "active") return false;

  const definition = await getDefinitionById(instance.definitionId);
  if (!definition) return false;

  const transition = findTransition(definition, {
    transitionId,
    fromState: instance.currentState,
  });
  if (!transition) return false;

  if (!canTransitionGuard(ctx, transition)) return false;
  const guard = await evaluateGuard(ctx, transition);
  return guard.ok;
}

export async function transition(
  ctx: ExecutionContext,
  input: TransitionWorkflowInput
): Promise<WorkflowInstance> {
  const instance = await getInstanceById(input.instanceId);
  if (!instance) throw new Error("Instancia de workflow no encontrada.");
  if (instance.status !== "active") throw new Error("El workflow no está activo.");

  const definition = await getDefinitionById(instance.definitionId);
  if (!definition) throw new Error("Definición de workflow no encontrada.");

  const transitionDef = findTransition(definition, {
    transitionId: input.transitionId,
    toState: input.toState,
    fromState: instance.currentState,
  });

  if (!transitionDef) {
    throw new Error("Transición no válida desde el estado actual.");
  }

  if (transitionDef.permission) {
    authorizeOrThrow(authFromContext(ctx), transitionDef.permission);
  }

  const guard = await evaluateGuard(ctx, transitionDef);
  if (!guard.ok) {
    const err = new Error(guard.error ?? "Guard rechazó la transición.") as Error & {
      status: number;
    };
    err.status = 403;
    throw err;
  }

  const fromState = instance.currentState;
  const toState = transitionDef.toState;
  const isFinal = isFinalState(definition, toState);

  await runActions(transitionDef.actions, {
    ctx,
    instance,
    transition: transitionDef,
    comment: input.comment,
    metadata: input.metadata,
  });

  const updated = await updateInstanceState(
    instance._id,
    toState,
    isFinal ? "completed" : "active",
    isFinal ? new Date().toISOString() : undefined
  );

  await appendHistory({
    workflowInstanceId: instance._id,
    tenantId: ctx.tenant,
    entityType: instance.entityType,
    entityId: instance.entityId,
    definitionId: instance.definitionId,
    fromState,
    toState,
    performedBy: ctx.user._id,
    comment: input.comment,
    metadata: input.metadata,
  });

  const event: WorkflowDomainEvent = {
    type: isFinal ? "WorkflowCompleted" : "WorkflowTransitioned",
    tenantId: ctx.tenant,
    entityType: instance.entityType,
    entityId: instance.entityId,
    workflowInstanceId: instance._id,
    definitionId: instance.definitionId,
    fromState,
    toState,
    performedBy: ctx.user._id,
    timestamp: new Date().toISOString(),
    metadata: input.metadata,
  };

  await publish(event);
  await publishTransitionEvents(transitionDef.events, event);

  return updated!;
}

export async function getCurrentState(instanceId: string): Promise<string | null> {
  const instance = await getInstanceById(instanceId);
  return instance?.currentState ?? null;
}

export async function getHistory(instanceId: string) {
  return getHistoryByInstance(instanceId);
}

export async function cancelWorkflow(
  ctx: ExecutionContext,
  instanceId: string,
  comment?: string
): Promise<WorkflowInstance> {
  authorizeOrThrow(authFromContext(ctx), "workflow.manage");

  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error("Instancia no encontrada.");

  const definition = await getDefinitionById(instance.definitionId);
  const cancelledState =
    definition?.states.find((s) => s.type === "cancelled")?.key ?? "cancelled";

  const fromState = instance.currentState;
  const updated = await updateInstanceState(
    instanceId,
    cancelledState,
    "cancelled",
    new Date().toISOString()
  );

  await appendHistory({
    workflowInstanceId: instanceId,
    tenantId: ctx.tenant,
    entityType: instance.entityType,
    entityId: instance.entityId,
    definitionId: instance.definitionId,
    fromState,
    toState: cancelledState,
    performedBy: ctx.user._id,
    comment,
    metadata: { event: "WorkflowCancelled" },
  });

  await publish({
    type: "WorkflowCancelled",
    tenantId: ctx.tenant,
    entityType: instance.entityType,
    entityId: instance.entityId,
    workflowInstanceId: instanceId,
    definitionId: instance.definitionId,
    fromState,
    toState: cancelledState,
    performedBy: ctx.user._id,
    timestamp: new Date().toISOString(),
  });

  return updated!;
}

export async function restartWorkflow(
  ctx: ExecutionContext,
  instanceId: string
): Promise<WorkflowInstance> {
  authorizeOrThrow(authFromContext(ctx), "workflow.manage");

  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error("Instancia no encontrada.");

  const definition = await getDefinitionById(instance.definitionId);
  if (!definition) throw new Error("Definición no encontrada.");

  const updated = await updateInstanceState(
    instanceId,
    definition.initialState,
    "active",
    undefined
  );

  await appendHistory({
    workflowInstanceId: instanceId,
    tenantId: ctx.tenant,
    entityType: instance.entityType,
    entityId: instance.entityId,
    definitionId: instance.definitionId,
    fromState: instance.currentState,
    toState: definition.initialState,
    performedBy: ctx.user._id,
    metadata: { event: "WorkflowRestarted" },
  });

  return updated!;
}

export async function getAvailableTransitions(
  ctx: ExecutionContext,
  instanceId: string
): Promise<WorkflowTransition[]> {
  const instance = await getInstanceById(instanceId);
  if (!instance || instance.status !== "active") return [];

  const definition = await getDefinitionById(instance.definitionId);
  if (!definition) return [];

  const candidates = definition.transitions.filter(
    (t) => t.fromState === instance.currentState
  );

  const available: WorkflowTransition[] = [];
  for (const t of candidates) {
    if (await canTransition(ctx, instanceId, t.id)) {
      available.push(t);
    }
  }
  return available;
}
