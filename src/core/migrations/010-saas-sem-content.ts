import { materializeSemTenantContent } from "@/core/tenant/sem-content";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-SAAS-007 — contenido SEM como datos de T001.
 * Formularios, convocatorias (vía forms), admisión y menús.
 * Seeds CMS de colecciones: API `seedContentCollections` (solo SEM).
 * Idempotente. No aplica a otros Espacios.
 */
export const migration010SaasSemContent: MigrationDefinition = {
  id: "010-saas-sem-content",
  description:
    "Materializa contenido SEM (forms, admisión, menús) solo en T001",
  modules: ["content", "menu"],

  async run({ db, log }) {
    const result = await materializeSemTenantContent(db);
    const details = [
      `forms inserted=${result.formsInserted} skipped=${result.formsSkipped}`,
      `admission created=${result.admissionCreated} skipped=${result.admissionSkipped}`,
      `menus inserted=${result.menusInserted} skipped=${result.menusSkipped}`,
    ];
    for (const line of details) log(line);

    const affected =
      result.formsInserted +
      Number(result.admissionCreated) +
      result.menusInserted;

    return {
      documentsAffected: affected,
      skipped:
        result.formsSkipped +
        Number(result.admissionSkipped) +
        result.menusSkipped,
      details,
    };
  },
};
