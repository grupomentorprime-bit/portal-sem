import { ensureGrowthAutomationIndexes } from "@/core/growth/automations/indexes";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-AUTOMATION-002 — índices growth_automations + growth_automation_versions.
 * Idempotente. Sin runtime, sin subscriber, sin WAIT.
 */
export const migration016GrowthAutomations: MigrationDefinition = {
  id: "016-growth-automations",
  description:
    "Índices tenant-scoped de Automatizaciones versionadas (identidad + versiones)",
  modules: [],

  async run({ db, log }) {
    const { results } = await ensureGrowthAutomationIndexes(db);
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
