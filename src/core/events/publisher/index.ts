import "server-only";

import type { DomainEvent, PublishInput } from "@/types/events";
import { dispatch } from "@/core/events/bus/dispatcher";
import { registerBuiltinHandlers } from "@/core/events/handlers/builtin";
import { buildDomainEvent } from "@/core/events/utils/context";

registerBuiltinHandlers();
import {
  cancelScheduledEvent,
  markScheduledPublished,
  scheduleEvent,
} from "@/core/events/persistence/store";

export interface PublishOptions {
  /** Evita escritura en MongoDB — útil para telemetría de render en el camino crítico. */
  skipPersist?: boolean;
}

export async function publish(input: PublishInput, options?: PublishOptions): Promise<DomainEvent> {
  const event = buildDomainEvent(input);
  await dispatch(event, { skipPersist: options?.skipPersist });
  return event;
}

export async function publishMany(inputs: PublishInput[]): Promise<DomainEvent[]> {
  const events: DomainEvent[] = [];
  for (const input of inputs) {
    events.push(await publish(input));
  }
  return events;
}

export async function schedule(input: {
  tenantId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  scheduledFor: string;
}): Promise<{ scheduledId: string }> {
  const doc = await scheduleEvent({
    tenantId: input.tenantId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? {},
    scheduledFor: input.scheduledFor,
  });
  return { scheduledId: doc._id };
}

export async function cancelScheduled(scheduledId: string): Promise<boolean> {
  return cancelScheduledEvent(scheduledId);
}

/** Procesa eventos programados vencidos (llamar desde cron o al publicar). */
export async function flushScheduledEvents(): Promise<number> {
  const { listDueScheduledEvents } = await import("@/core/events/persistence/store");
  const due = await listDueScheduledEvents();
  let count = 0;

  for (const item of due) {
    await publish({
      type: item.type,
      tenantId: item.tenantId,
      entityType: item.entityType,
      entityId: item.entityId,
      payload: item.payload,
      metadata: { scheduledId: item._id },
    });
    await markScheduledPublished(item._id);
    count++;
  }

  return count;
}
