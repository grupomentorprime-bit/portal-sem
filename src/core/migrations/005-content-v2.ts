import { MODULE_VERSIONS } from "@/lib/cms/schema-versions";
import { bumpConfigModuleForAllTenants } from "@/core/migrations/config-helpers";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Placeholder — reservado para páginas / bloques CMS (cms_pages) */
export const migration005ContentV2: MigrationDefinition = {
  id: "005-content-v2",
  description: "Contenido — inicialización de versión de módulo (cms_pages)",
  modules: ["content"],

  async run({ db, log }) {
    const { affected, skipped } = await bumpConfigModuleForAllTenants(
      db,
      "content",
      MODULE_VERSIONS.content
    );
    log(`005-content-v2: ${affected} actualizado(s), ${skipped} omitido(s)`);
    return {
      documentsAffected: affected,
      skipped,
      details: ["Marcador de versión modules.content — sin transformación de datos aún"],
    };
  },
};
