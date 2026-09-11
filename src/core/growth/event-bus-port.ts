/**
 * OT-GROWTH-CORE-004 / ADR-010 §4.4 — puerto al Event Bus existente (core_events).
 * Sin segundo bus. Inyectable para tests (publisher real es server-only).
 */

import type { GrowthActivityKind } from "./types";

/** Tipos Domain Event Growth (ADR-010 §4.4). Se registran en el catálogo del bus. */
export const GROWTH_DOMAIN_EVENT_TYPES = [
  "GrowthPersonaUpserted",
  "GrowthOpportunityOpened",
  "GrowthOpportunityTransitioned",
  "GrowthActivityRecorded",
  "GrowthNextActionSet",
  "GrowthHandoffRecorded",
  /** OT-GROWTH-MESSAGING-001 — mensaje entrante (contrato; sin Meta). */
  "GrowthMessageReceived",
  /** OT-GROWTH-MESSAGING-003 — mensaje saliente enviado. */
  "GrowthMessageSent",
] as const;

export type GrowthDomainEventType = (typeof GROWTH_DOMAIN_EVENT_TYPES)[number];

export interface GrowthEventPublishInput {
  type: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  userId?: string;
}

export interface GrowthEventBusPort {
  publish(input: GrowthEventPublishInput): Promise<{ id: string }>;
}

/** Mapeo kind → tipo de evento (un evento por Actividad persistida). */
export function growthEventTypeForActivityKind(
  kind: GrowthActivityKind
): GrowthDomainEventType {
  switch (kind) {
    case "opportunity_opened":
      return "GrowthOpportunityOpened";
    case "opportunity_transitioned":
      return "GrowthOpportunityTransitioned";
    case "next_action_set":
      return "GrowthNextActionSet";
    case "handoff":
      return "GrowthHandoffRecorded";
    default:
      return "GrowthActivityRecorded";
  }
}

/** Bus en memoria para tests; `failNext` simula fallo sin borrar Actividad. */
export function createMemoryGrowthEventBus(): GrowthEventBusPort & {
  events: Array<GrowthEventPublishInput & { id: string }>;
  failNext: boolean;
  failAlways: boolean;
} {
  const events: Array<GrowthEventPublishInput & { id: string }> = [];
  let seq = 0;
  const bus = {
    events,
    failNext: false,
    failAlways: false,
    async publish(input: GrowthEventPublishInput) {
      if (bus.failAlways || bus.failNext) {
        bus.failNext = false;
        throw new Error("GrowthEventBus simulated failure");
      }
      seq += 1;
      const id = `evt-mem-${seq}`;
      events.push({ ...input, id });
      return { id };
    },
  };
  return bus;
}
