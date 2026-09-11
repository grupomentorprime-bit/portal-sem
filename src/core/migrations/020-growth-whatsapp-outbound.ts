import { ensureGrowthMessagingIndexes } from "@/core/growth/messaging";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-MESSAGING-003 — índice clientRequestId (reintento outbound) + índices messaging.
 * Idempotente. No toca Automatizaciones ni bandeja.
 */
export const migration020GrowthWhatsAppOutbound: MigrationDefinition = {
  id: "020-growth-whatsapp-outbound",
  description:
    "Índice unique sparse tenantId+clientRequestId en growth_mensajes (reintento WhatsApp outbound)",
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
