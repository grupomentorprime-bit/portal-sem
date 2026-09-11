import { ensureGrowthWhatsAppIndexes } from "@/core/growth/whatsapp";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-MESSAGING-002 — índices growth_whatsapp_connections.
 * Idempotente. Secretos fuera del documento del Espacio.
 */
export const migration019GrowthWhatsApp: MigrationDefinition = {
  id: "019-growth-whatsapp",
  description:
    "Índices únicos de conexiones WhatsApp Cloud API (tenantId + phoneNumberId)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthWhatsAppIndexes(db);
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
