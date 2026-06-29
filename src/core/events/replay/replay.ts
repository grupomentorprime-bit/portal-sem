import "server-only";

import type { DomainEvent } from "@/types/events";
import { dispatch } from "@/core/events/bus/dispatcher";
import { getEventById } from "@/core/events/persistence/store";

export async function replayEvent(eventId: string): Promise<{
  ok: boolean;
  result?: Awaited<ReturnType<typeof dispatch>>;
  error?: string;
}> {
  const stored = await getEventById(eventId);
  if (!stored) {
    return { ok: false, error: "Evento no encontrado." };
  }

  const event: DomainEvent = {
    id: stored.id,
    type: stored.type,
    version: stored.version,
    tenantId: stored.tenantId,
    entityType: stored.entityType,
    entityId: stored.entityId,
    occurredAt: stored.occurredAt,
    userId: stored.userId,
    correlationId: stored.correlationId,
    causationId: stored.causationId,
    payload: stored.payload,
    metadata: { ...stored.metadata, replayed: true, replayedAt: new Date().toISOString() },
    context: stored.context,
  };

  const result = await dispatch(event, { skipPersist: true });
  return { ok: true, result };
}

export async function replayEventsByType(
  tenantId: string,
  type: string,
  limit = 20
): Promise<{ replayed: number; errors: string[] }> {
  const { listEvents } = await import("@/core/events/persistence/store");
  const events = await listEvents(tenantId, { type, limit });
  let replayed = 0;
  const errors: string[] = [];

  for (const stored of events) {
    const res = await replayEvent(stored.id);
    if (res.ok) replayed++;
    else if (res.error) errors.push(`${stored.id}: ${res.error}`);
  }

  return { replayed, errors };
}
