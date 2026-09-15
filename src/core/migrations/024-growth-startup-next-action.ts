import {
  backfillGrowthStartupNextActionAutomations,
  ensureGrowthAutomationIndexes,
} from "@/core/growth/automations";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-E2E-FIX-001 — índice seedKey + backfill playbook de arranque por Espacio.
 * Idempotente. No toca producción a mano; no reactiva automations editadas/desactivadas.
 */
export const migration024GrowthStartupNextAction: MigrationDefinition = {
  id: "024-growth-startup-next-action",
  description:
    "Índice tenantId+seedKey + seed Automatización primera próxima acción (Captura → Qué hacer ahora)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthAutomationIndexes(db);
    const details = results.map((r) => `index ${r.name}=${r.result}`);

    const backfill = await backfillGrowthStartupNextActionAutomations(db);
    details.push(
      `backfill tenants=${backfill.tenants} created=${backfill.created} existing=${backfill.existing} failed=${backfill.failed}`
    );
    for (const line of backfill.details.slice(0, 50)) {
      details.push(line);
    }

    for (const line of details) log(line);

    let documentsAffected = backfill.created;
    let skipped = backfill.existing;
    for (const r of results) {
      if (r.result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    return {
      documentsAffected,
      skipped: skipped + backfill.failed,
      details,
    };
  },
};
