import type { DomainEvent } from "@/types/events";
import { subscribe, subscribeMany } from "@/core/events/subscribers";
import { GROWTH_DOMAIN_EVENT_TYPES } from "@/core/growth/event-bus-port";

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
      const email = String(event.payload.email ?? "");
      const displayName = String(event.payload.displayName ?? "");
      const expiresAt = String(event.payload.expiresAt ?? "");

      if (!email) return;

      const { findInvitationById } = await import("@/lib/identity/invitations");
      const invitation = await findInvitationById(event.entityId, event.tenantId);
      const token = invitation?.token ?? "";
      if (!token) return;

      const { sendInvitationEmail } = await import("@/lib/notifications/email");

      const result = await sendInvitationEmail({
        to: email,
        displayName: displayName || email,
        token,
        tenantId: event.tenantId,
        expiresAt,
      });

      if (!result.ok) {
        console.error("[events:notifications] invitation email failed");
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

/**
 * OT-GROWTH-AUTOMATION-003/005 — subscriber in-process al Event Bus existente.
 * Growth*: Automatizaciones active → sales-ops (fail-soft).
 * GrowthAutomationResume: continúa tras WAIT (propaga fallo al flush).
 */
export function registerGrowthAutomationHandlers(): void {
  subscribeMany(
    [...GROWTH_DOMAIN_EVENT_TYPES],
    async (event: DomainEvent) => {
      const { onGrowthAutomationDomainEvent } = await import(
        "@/lib/growth/automations-runtime"
      );
      await onGrowthAutomationDomainEvent(event);
    },
    { name: "growth.automations" }
  );

  subscribe(
    "GrowthAutomationResume",
    async (event: DomainEvent) => {
      const { onGrowthAutomationDomainEvent } = await import(
        "@/lib/growth/automations-runtime"
      );
      await onGrowthAutomationDomainEvent(event);
    },
    { name: "growth.automations.resume" }
  );
}

let registered = false;

export function registerBuiltinHandlers(): void {
  if (registered) return;
  registered = true;
  registerSearchHandlers();
  registerNotificationHandlers();
  registerAnalyticsHandlers();
  registerGrowthAutomationHandlers();
  void import("@/core/events/scheduled-runner").then((m) => {
    m.ensureScheduledEventsRunner();
  });
}
