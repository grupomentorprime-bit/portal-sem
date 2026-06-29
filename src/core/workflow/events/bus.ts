import type { WorkflowDomainEvent } from "@/types/workflow";

export type WorkflowEventHandler = (event: WorkflowDomainEvent) => void | Promise<void>;

const subscribers = new Map<string, WorkflowEventHandler[]>();

export function subscribe(eventType: string, handler: WorkflowEventHandler): () => void {
  const list = subscribers.get(eventType) ?? [];
  list.push(handler);
  subscribers.set(eventType, list);
  return () => {
    const current = subscribers.get(eventType) ?? [];
    subscribers.set(
      eventType,
      current.filter((h) => h !== handler)
    );
  };
}

export async function publish(event: WorkflowDomainEvent): Promise<void> {
  const handlers = [
    ...(subscribers.get(event.type) ?? []),
    ...(subscribers.get("*") ?? []),
  ];
  await Promise.all(handlers.map((h) => h(event)));
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
