import { ensureGrowthAutomationIndexes } from "@/core/growth/automations/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-AUTOMATION-007 — índices growth_automation_runs (proyección de historial).
 * Idempotente. No duplica Event Bus ni actividades.
 */
export const migration017GrowthAutomationRuns: MigrationDefinition = {
  id: "017-growth-automation-runs",
  description:
    "Índices tenant-scoped de ejecuciones de Automatizaciones (historial «Qué ha pasado»)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthAutomationIndexes(db);
    const runResults = results.filter(
      (r) =>
        r.name.includes("attemptKey") || r.name.includes("startedAt")
    );
    const details = runResults.map((r) => `index ${r.name}=${r.result}`);
    for (const line of details) log(line);

    let documentsAffected = 0;
    let skipped = 0;
    for (const r of runResults) {
      if (r.result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    return { documentsAffected, skipped, details };
  },
};
