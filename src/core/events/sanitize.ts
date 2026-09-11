import "server-only";

import { omitSensitiveFields, redactSensitiveText } from "@/core/security/redact";
import type { DeadLetterEntry, DomainEvent, StoredEvent } from "@/types/events";

function sanitizeDomainEvent(event: DomainEvent): DomainEvent {
  return {
    ...event,
    payload: omitSensitiveFields(event.payload),
    metadata: event.metadata ? omitSensitiveFields(event.metadata) : undefined,
  };
}

export function sanitizeStoredEventForClient(event: StoredEvent): StoredEvent {
  return {
    ...sanitizeDomainEvent(event),
    status: event.status,
    retries: event.retries,
    processingMs: event.processingMs,
    handlersExecuted: event.handlersExecuted,
    error: event.error ? redactSensitiveText(event.error) : undefined,
    createdAt: event.createdAt,
    processedAt: event.processedAt,
  };
}

export function sanitizeDeadLetterForClient(entry: DeadLetterEntry): DeadLetterEntry {
  return {
    ...entry,
    error: redactSensitiveText(entry.error),
    stack: undefined,
    event: sanitizeDomainEvent(entry.event),
  };
}
