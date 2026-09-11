/**
 * OT-GROWTH-MESSAGING-002 — conexiones en memoria (tests).
 */

import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import type { GrowthWhatsAppConnection } from "./types";

export function createMemoryGrowthWhatsAppConnectionStore(): GrowthWhatsAppConnectionStore & {
  connections: Map<string, GrowthWhatsAppConnection>;
} {
  const connections = new Map<string, GrowthWhatsAppConnection>();

  function byPhone(phoneNumberId: string): GrowthWhatsAppConnection[] {
    return [...connections.values()].filter(
      (c) => c.phoneNumberId === phoneNumberId
    );
  }

  return {
    connections,

    async findByPhoneNumberId(phoneNumberId) {
      const matches = byPhone(phoneNumberId);
      if (matches.length === 0) return null;
      return structuredClone(matches[0]);
    },

    async findEnabledByPhoneNumberId(phoneNumberId) {
      const matches = byPhone(phoneNumberId).filter((c) => c.enabled);
      return matches.length === 1 ? structuredClone(matches[0]) : null;
    },

    async findByTenantId(tenantId) {
      const found = connections.get(tenantId);
      return found ? structuredClone(found) : null;
    },

    async listEnabled() {
      return [...connections.values()]
        .filter((c) => c.enabled)
        .map((c) => structuredClone(c));
    },

    async upsert(connection) {
      connections.set(connection.tenantId, structuredClone(connection));
      return structuredClone(connection);
    },
  };
}
