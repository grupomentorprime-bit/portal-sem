import { materializeSemSiteIdentity } from "@/core/tenant/migrate-sem";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-SAAS-006 — identidad visual SEM en T001/S001.
 * Completa campos vacíos (nombre, logos, SEO, contacto, redes) desde dato T001.
 * No pisa valores ya guardados. No aplica a otros Sites.
 */
export const migration009SaasBranding: MigrationDefinition = {
  id: "009-saas-branding",
  description:
    "Materializa branding SEM en T001/S001; Sites vacíos no heredan identidad SEM",
  modules: ["branding"],

  async run({ db, log }) {
    const result = await materializeSemSiteIdentity(db);
    const details = [
      `T001 name=${result.config.institution.name}`,
      `logo=${result.config.branding.logo || "(vacío)"}`,
      `favicon=${result.config.branding.favicon || "(vacío)"}`,
      `filled=${result.filled} site_config created=${result.created} updated=${result.updated}`,
    ];
    for (const line of details) log(line);

    return {
      documentsAffected: Number(result.filled) + Number(result.created) + Number(result.updated),
      skipped: result.filled ? 0 : 1,
      details,
    };
  },
};
