import "server-only";

import type { DomainEvent, PublishInput } from "@/types/events";
import { dispatch } from "@/core/events/bus/dispatcher";
import { registerBuiltinHandlers } from "@/core/events/handlers/builtin";
import { buildDomainEvent } from "@/core/events/utils/context";

registerBuiltinHandlers();
import {
  cancelScheduledEvent,
  claimDueScheduledEvent,
  markScheduledPublished,
  releaseScheduledClaim,
  scheduleEvent,
} from "@/core/events/persistence/store";
import { ensureScheduledEventsRunner } from "@/core/events/scheduled-runner";

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

export type FlushScheduledResult = {
  published: number;
  failed: number;
  errors: Array<{ scheduledId: string; error: string }>;
};

/**
 * Despierta programados vencidos fuera del request origen.
 * Claim atómico → publish (Event Bus) → published; fallo → reintento sin bloquear el resto.
 */
export async function flushScheduledEvents(
  options?: { limit?: number }
): Promise<number> {
  const result = await flushScheduledEventsDetailed(options);
  return result.published;
}

export async function flushScheduledEventsDetailed(
  options?: { limit?: number }
): Promise<FlushScheduledResult> {
  ensureScheduledEventsRunner();
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  let published = 0;
  let failed = 0;
  const errors: Array<{ scheduledId: string; error: string }> = [];

  for (let i = 0; i < limit; i++) {
    const item = await claimDueScheduledEvent();
    if (!item) break;

    try {
      const event = buildDomainEvent({
        type: item.type,
        tenantId: item.tenantId,
        entityType: item.entityType,
        entityId: item.entityId,
        payload: item.payload,
        metadata: { scheduledId: item._id },
        correlationId:
          typeof item.payload.correlationId === "string"
            ? item.payload.correlationId
            : undefined,
        causationId:
          typeof item.payload.sourceEventId === "string"
            ? item.payload.sourceEventId
            : typeof item.payload.causationId === "string"
              ? item.payload.causationId
              : undefined,
      });

      const dispatchResult = await dispatch(event);
      if (dispatchResult.failedHandlers.length > 0) {
        const message = `Failed handlers: ${dispatchResult.failedHandlers.join(", ")}`;
        await releaseScheduledClaim(item._id, message);
        failed += 1;
        errors.push({ scheduledId: item._id, error: message });
        continue;
      }

      await markScheduledPublished(item._id);
      published += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await releaseScheduledClaim(item._id, message);
      failed += 1;
      errors.push({ scheduledId: item._id, error: message });
    }
  }

  return { published, failed, errors };
}
