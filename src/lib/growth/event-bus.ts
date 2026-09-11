/**
 * OT-GROWTH-CORE-005 — adapter al Event Bus existente (core_events).
 */

import "server-only";

import type { GrowthEventBusPort, GrowthEventPublishInput } from "@/core/growth";
import { publish } from "@/core/events/publisher";

export function createGrowthEventBusAdapter(): GrowthEventBusPort {
  return {
    async publish(input: GrowthEventPublishInput) {
      const event = await publish({
        type: input.type,
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload,
        userId: input.userId,
      });
      return { id: event.id };
    },
  };
}
