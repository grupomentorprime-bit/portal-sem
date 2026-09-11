export { registerEventType, isKnownEventType, listEventTypes, DOMAIN_EVENT_TYPES } from "@/core/events/registry";
export type { DomainEventType } from "@/core/events/registry";

export { subscribe, subscribeMany, once, unsubscribe, listSubscriptions } from "@/core/events/subscribers";

export {
  publish,
  publishMany,
  schedule,
  cancelScheduled,
  flushScheduledEvents,
  flushScheduledEventsDetailed,
} from "@/core/events/publisher";
export type { FlushScheduledResult } from "@/core/events/publisher";

export { dispatch } from "@/core/events/bus/dispatcher";

export {
  ensureScheduledEventsRunner,
  stopScheduledEventsRunnerForTests,
} from "@/core/events/scheduled-runner";

export { replayEvent, replayEventsByType } from "@/core/events/replay/replay";

export { buildDomainEvent, generateEventId, generateCorrelationId, eventContextFromAuth } from "@/core/events/utils/context";

export {
  persistEvent,
  getEventById,
  listEvents,
  listDeadLetters,
  writeDeadLetter,
} from "@/core/events/persistence/store";

export { registerBuiltinHandlers } from "@/core/events/handlers/builtin";
