import { randomBytes } from "node:crypto";
import type { DomainEvent, EventContext, PublishInput } from "@/types/events";
import { registerEventType } from "@/core/events/registry";

export function generateEventId(): string {
  return `evt-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

export function generateCorrelationId(): string {
  return randomBytes(12).toString("hex");
}

export function buildDomainEvent(input: PublishInput): DomainEvent {
  registerEventType(input.type);

  const correlationId = input.correlationId ?? input.context?.correlationId ?? generateCorrelationId();

  const context: EventContext = {
    tenantId: input.tenantId,
    correlationId,
    requestId: input.context?.requestId ?? randomBytes(8).toString("hex"),
    traceId: input.context?.traceId ?? randomBytes(8).toString("hex"),
    userId: input.userId ?? input.context?.userId,
    sessionId: input.context?.sessionId,
    causationId: input.causationId ?? input.context?.causationId,
  };

  return {
    id: generateEventId(),
    type: input.type,
    version: input.version ?? 1,
    tenantId: input.tenantId,
    entityType: input.entityType,
    entityId: input.entityId,
    occurredAt: new Date().toISOString(),
    userId: input.userId ?? context.userId,
    correlationId,
    causationId: input.causationId ?? context.causationId,
    payload: input.payload ?? {},
    metadata: input.metadata,
    context,
  };
}

export function eventContextFromAuth(auth: {
  tenantId: string;
  user: { _id: string };
  session: { _id: string };
}): Partial<EventContext> {
  return {
    tenantId: auth.tenantId,
    userId: auth.user._id,
    sessionId: auth.session._id,
    correlationId: generateCorrelationId(),
    requestId: randomBytes(8).toString("hex"),
    traceId: randomBytes(8).toString("hex"),
  };
}
