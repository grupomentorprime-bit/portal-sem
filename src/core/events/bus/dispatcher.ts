import type { DomainEvent, DispatchResult } from "@/types/events";
import {
  getHandlersForEvent,
  removeOnceSubscriptions,
  type Subscription,
} from "@/core/events/subscribers";
import { persistEvent, updateEventStatus, writeDeadLetter } from "@/core/events/persistence/store";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runHandlerWithRetry(
  sub: Subscription,
  event: DomainEvent,
  attempt = 1
): Promise<{ ok: true } | { ok: false; error: Error }> {
  try {
    await sub.handler(event);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
      return runHandlerWithRetry(sub, event, attempt + 1);
    }
    return { ok: false, error };
  }
}

export async function dispatch(event: DomainEvent, options?: { skipPersist?: boolean }): Promise<DispatchResult> {
  const start = Date.now();
  const handlers = getHandlersForEvent(event);
  const handlersExecuted: string[] = [];
  const failedHandlers: string[] = [];
  const onceIds: string[] = [];

  if (!options?.skipPersist) {
    await persistEvent(event, { status: "processing" });
  }

  for (const sub of handlers) {
    const result = await runHandlerWithRetry(sub, event);
    if (result.ok) {
      handlersExecuted.push(sub.name);
      if (sub.once) onceIds.push(sub.id);
    } else {
      failedHandlers.push(sub.name);
      await writeDeadLetter({
        eventId: event.id,
        tenantId: event.tenantId,
        type: event.type,
        handler: sub.name,
        error: result.error.message,
        stack: result.error.stack,
        attempts: MAX_RETRIES,
        event,
      });
    }
  }

  if (onceIds.length) {
    removeOnceSubscriptions(event.type, onceIds);
    removeOnceSubscriptions("*", onceIds);
  }

  const processingMs = Date.now() - start;
  const status = failedHandlers.length ? (handlersExecuted.length ? "processed" : "failed") : "processed";

  const { logDispatchMetrics } = await import("@/core/events/middleware/observability");
  logDispatchMetrics({ eventId: event.id, handlersExecuted, processingMs, failedHandlers }, event.type);

  if (!options?.skipPersist) {
    await updateEventStatus(event.id, {
      status: failedHandlers.length && !handlersExecuted.length ? "dead_letter" : status,
      retries: failedHandlers.length ? MAX_RETRIES : 0,
      processingMs,
      handlersExecuted,
      processedAt: new Date().toISOString(),
      error: failedHandlers.length ? `Failed handlers: ${failedHandlers.join(", ")}` : undefined,
    });
  }

  return { eventId: event.id, handlersExecuted, processingMs, failedHandlers };
}
