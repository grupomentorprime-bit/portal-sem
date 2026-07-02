import { MODULE_VERSIONS } from "@/lib/cms/schema-versions";
import { bumpConfigModuleForAllTenants } from "@/core/migrations/config-helpers";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Placeholder — reservado para consolidación branding / mediaIds */
export const migration004BrandingV2: MigrationDefinition = {
  id: "004-branding-v2",
  description: "Branding — inicialización de versión de módulo",
  modules: ["branding"],

  async run({ db, log }) {
    const { affected, skipped } = await bumpConfigModuleForAllTenants(
      db,
      "branding",
      MODULE_VERSIONS.branding
    );
    log(`004-branding-v2: ${affected} actualizado(s), ${skipped} omitido(s)`);
    return {
      documentsAffected: affected,
      skipped,
      details: ["Marcador de versión modules.branding — sin transformación de datos aún"],
    };
  },
};
