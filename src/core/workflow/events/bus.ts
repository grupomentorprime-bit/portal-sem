import type { WorkflowDomainEvent } from "@/types/workflow";
import type { DomainEvent } from "@/types/events";
import { publish as corePublish } from "@/core/events/publisher";
import { subscribe as coreSubscribe } from "@/core/events/subscribers";

export type WorkflowEventHandler = (event: WorkflowDomainEvent) => void | Promise<void>;

function workflowFromDomain(event: DomainEvent): WorkflowDomainEvent {
  const p = event.payload;
  return {
    type: event.type as WorkflowDomainEvent["type"],
    tenantId: event.tenantId,
    entityType: event.entityType,
    entityId: event.entityId,
    workflowInstanceId: String(p.workflowInstanceId ?? ""),
    definitionId: String(p.definitionId ?? ""),
    fromState: p.fromState as string | undefined,
    toState: p.toState as string | undefined,
    performedBy: event.userId ?? String(p.performedBy ?? ""),
    timestamp: event.occurredAt,
    metadata: event.metadata,
  };
}

function domainFromWorkflow(event: WorkflowDomainEvent) {
  return {
    type: event.type,
    tenantId: event.tenantId,
    entityType: event.entityType,
    entityId: event.entityId,
    userId: event.performedBy,
    payload: {
      workflowInstanceId: event.workflowInstanceId,
      definitionId: event.definitionId,
      fromState: event.fromState,
      toState: event.toState,
      performedBy: event.performedBy,
    },
    metadata: event.metadata,
  };
}

export function subscribe(eventType: string, handler: WorkflowEventHandler): () => void {
  return coreSubscribe(
    eventType,
    (e) => handler(workflowFromDomain(e)),
    { name: handler.name || `workflow.${eventType}` }
  );
}

export async function publish(event: WorkflowDomainEvent): Promise<void> {
  await corePublish(domainFromWorkflow(event));
}

export async function publishTransitionEvents(
  eventTypes: string[] | undefined,
  event: WorkflowDomainEvent
): Promise<void> {
  if (!eventTypes?.length) return;
  for (const type of eventTypes) {
    await publish({ ...event, type: type as WorkflowDomainEvent["type"] });
  }
}
