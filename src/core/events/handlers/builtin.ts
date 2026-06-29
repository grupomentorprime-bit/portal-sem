import type { DomainEvent } from "@/types/events";
import { subscribe } from "@/core/events/subscribers";

/** Search: indexa contenido al publicar páginas */
export function registerSearchHandlers(): void {
  subscribe(
    "PagePublished",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:search] index", event.entityId, event.payload);
      }
    },
    { name: "search.indexPage" }
  );

  subscribe(
    "NewsPublished",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:search] index news", event.entityId);
      }
    },
    { name: "search.indexNews" }
  );

  subscribe(
    "ProgramPublished",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:search] index program", event.entityId);
      }
    },
    { name: "search.indexProgram" }
  );
}

/** Notifications: envía email en invitaciones */
export function registerNotificationHandlers(): void {
  subscribe(
    "InvitationCreated",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:notifications] invitation email", event.payload.email);
      }
    },
    { name: "notifications.invitationEmail" }
  );
}

/** Analytics: registra transiciones de workflow */
export function registerAnalyticsHandlers(): void {
  subscribe(
    "WorkflowTransitioned",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:analytics] workflow transition", event.entityId, event.payload);
      }
    },
    { name: "analytics.workflowTransition" }
  );

  subscribe(
    "UserLoggedIn",
    async (event: DomainEvent) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[events:analytics] login", event.userId);
      }
    },
    { name: "analytics.userLogin" }
  );
}

let registered = false;

export function registerBuiltinHandlers(): void {
  if (registered) return;
  registered = true;
  registerSearchHandlers();
  registerNotificationHandlers();
  registerAnalyticsHandlers();
}
