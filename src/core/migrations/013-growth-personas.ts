import { ensureGrowthPersonaIndexes } from "@/core/growth/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-CORE-002 — índices growth_personas (+ ingestKey sparse en actividades stub).
 * Idempotente. No backfill ni cableado de captación.
 */
export const migration013GrowthPersonas: MigrationDefinition = {
  id: "013-growth-personas",
  description:
    "Índices tenant-scoped de growth_personas (email/teléfono unique sparse) + ingestKey actividades",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthPersonaIndexes(db);
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
