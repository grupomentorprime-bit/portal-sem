/** Event Bus — Domain Events de AprendeHoy Learning OS */

export const EVENT_STATUSES = ["pending", "processing", "processed", "failed", "dead_letter"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventContext {
  requestId?: string;
  traceId?: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  correlationId: string;
  causationId?: string;
}

export interface DomainEvent {
  id: string;
  type: string;
  version: number;
  tenantId: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  userId?: string;
  correlationId: string;
  causationId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: EventContext;
}

export interface StoredEvent extends DomainEvent {
  status: EventStatus;
  retries: number;
  processingMs?: number;
  handlersExecuted?: string[];
  error?: string;
  createdAt: string;
  processedAt?: string;
}

export interface DeadLetterEntry {
  _id: string;
  eventId: string;
  tenantId: string;
  type: string;
  handler: string;
  error: string;
  stack?: string;
  attempts: number;
  event: DomainEvent;
  createdAt: string;
}

export interface ScheduledEvent {
  _id: string;
  tenantId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  scheduledFor: string;
  status: "scheduled" | "published" | "cancelled";
  createdAt: string;
}

export interface PublishInput {
  type: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  version?: number;
  context?: Partial<EventContext>;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface DispatchResult {
  eventId: string;
  handlersExecuted: string[];
  processingMs: number;
  failedHandlers: string[];
}
