import type { DomainEvent, EventHandler } from "@/types/events";

interface Subscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  name: string;
  once: boolean;
}

const subscriptions = new Map<string, Subscription[]>();
let subCounter = 0;

function handlerName(handler: EventHandler, explicit?: string): string {
  return explicit ?? (handler.name || `handler-${++subCounter}`);
}

export function subscribe(
  eventType: string,
  handler: EventHandler,
  options?: { name?: string }
): () => void {
  const sub: Subscription = {
    id: `sub-${++subCounter}`,
    eventType,
    handler,
    name: handlerName(handler, options?.name),
    once: false,
  };

  const list = subscriptions.get(eventType) ?? [];
  list.push(sub);
  subscriptions.set(eventType, list);

  return () => unsubscribe(sub.id, eventType);
}

export function subscribeMany(
  eventTypes: string[],
  handler: EventHandler,
  options?: { name?: string }
): () => void {
  const unsubs = eventTypes.map((t) => subscribe(t, handler, options));
  return () => unsubs.forEach((u) => u());
}

export function once(eventType: string, handler: EventHandler, options?: { name?: string }): () => void {
  const sub: Subscription = {
    id: `sub-${++subCounter}`,
    eventType,
    handler,
    name: handlerName(handler, options?.name),
    once: true,
  };

  const list = subscriptions.get(eventType) ?? [];
  list.push(sub);
  subscriptions.set(eventType, list);

  return () => unsubscribe(sub.id, eventType);
}

export function unsubscribe(subscriptionId: string, eventType: string): void {
  const list = subscriptions.get(eventType) ?? [];
  subscriptions.set(
    eventType,
    list.filter((s) => s.id !== subscriptionId)
  );
}

export function getHandlersForEvent(event: DomainEvent): Subscription[] {
  return [
    ...(subscriptions.get(event.type) ?? []),
    ...(subscriptions.get("*") ?? []),
  ];
}

export function removeOnceSubscriptions(eventType: string, ids: string[]): void {
  const list = subscriptions.get(eventType) ?? [];
  subscriptions.set(
    eventType,
    list.filter((s) => !ids.includes(s.id))
  );
}

export function listSubscriptions(): { eventType: string; name: string; once: boolean }[] {
  const result: { eventType: string; name: string; once: boolean }[] = [];
  for (const [eventType, subs] of subscriptions) {
    for (const s of subs) {
      result.push({ eventType, name: s.name, once: s.once });
    }
  }
  return result;
}

export type { Subscription };
