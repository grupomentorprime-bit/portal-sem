import { ensureGrowthMessagingIndexes } from "@/core/growth/messaging";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-MESSAGING-001 — índices growth_conversaciones + growth_mensajes.
 * Idempotente. Sin Meta, webhook, bandeja ni envío.
 */
export const migration018GrowthMessaging: MigrationDefinition = {
  id: "018-growth-messaging",
  description:
    "Índices tenant-scoped de growth_conversaciones y growth_mensajes (hilo externo + mensaje externo unique sparse)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthMessagingIndexes(db);
    const details = results.map((r) => `index ${r.name}=${r.result}`);
    for (const line of details) log(line);

    let documentsAffected = 0;
    let skipped = 0;
    for (const r of results) {
      if (r.result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    return { documentsAffected, skipped, details };
  },
};
