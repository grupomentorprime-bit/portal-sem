import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { DeadLetterEntry, DomainEvent, ScheduledEvent, StoredEvent } from "@/types/events";

export async function persistEvent(
  event: DomainEvent,
  extra?: Partial<StoredEvent>
): Promise<StoredEvent> {
  const db = await getDatabase();
  const stored: StoredEvent = {
    ...event,
    status: extra?.status ?? "pending",
    retries: extra?.retries ?? 0,
    handlersExecuted: extra?.handlersExecuted ?? [],
    createdAt: new Date().toISOString(),
    ...extra,
  };

  await db.collection<StoredEvent>("core_events").insertOne(stored);
  return stored;
}

export async function updateEventStatus(
  eventId: string,
  update: Partial<StoredEvent>
): Promise<void> {
  const db = await getDatabase();
  await db.collection<StoredEvent>("core_events").updateOne(
    { id: eventId },
    { $set: update }
  );
}

export async function getEventById(eventId: string): Promise<StoredEvent | null> {
  const db = await getDatabase();
  return db.collection<StoredEvent>("core_events").findOne({ id: eventId });
}

export async function listEvents(
  tenantId: string,
  options?: { limit?: number; type?: string; status?: string }
): Promise<StoredEvent[]> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { tenantId };
  if (options?.type) filter.type = options.type;
  if (options?.status) filter.status = options.status;

  return db
    .collection<StoredEvent>("core_events")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(options?.limit ?? 50)
    .toArray();
}

export async function writeDeadLetter(entry: Omit<DeadLetterEntry, "_id" | "createdAt">): Promise<void> {
  const db = await getDatabase();
  const doc: DeadLetterEntry = {
    ...entry,
    _id: `dlq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await db.collection<DeadLetterEntry>("core_event_dead_letter").insertOne(doc);
}

export async function listDeadLetters(tenantId: string, limit = 50): Promise<DeadLetterEntry[]> {
  const db = await getDatabase();
  return db
    .collection<DeadLetterEntry>("core_event_dead_letter")
    .find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function scheduleEvent(input: {
  tenantId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  scheduledFor: string;
}): Promise<ScheduledEvent> {
  const db = await getDatabase();
  const doc: ScheduledEvent = {
    _id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  await db.collection<ScheduledEvent>("core_scheduled_events").insertOne(doc);
  return doc;
}

export async function cancelScheduledEvent(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<ScheduledEvent>("core_scheduled_events").updateOne(
    { _id: id, status: "scheduled" },
    { $set: { status: "cancelled" } }
  );
  return result.modifiedCount > 0;
}

export async function listDueScheduledEvents(): Promise<ScheduledEvent[]> {
  const db = await getDatabase();
  return db
    .collection<ScheduledEvent>("core_scheduled_events")
    .find({ status: "scheduled", scheduledFor: { $lte: new Date().toISOString() } })
    .limit(20)
    .toArray();
}

export async function markScheduledPublished(id: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<ScheduledEvent>("core_scheduled_events").updateOne(
    { _id: id },
    { $set: { status: "published" } }
  );
}
