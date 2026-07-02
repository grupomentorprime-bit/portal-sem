import { MODULE_VERSIONS } from "@/lib/cms/schema-versions";
import { bumpConfigModuleForAllTenants } from "@/core/migrations/config-helpers";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Placeholder — reservado para evolución del esquema de menús (cms_menus) */
export const migration002MenuV2: MigrationDefinition = {
  id: "002-menu-v2",
  description: "Menú — inicialización de versión de módulo (cms_menus)",
  modules: ["menu"],

  async run({ db, log }) {
    const { affected, skipped } = await bumpConfigModuleForAllTenants(
      db,
      "menu",
      MODULE_VERSIONS.menu
    );
    log(`002-menu-v2: ${affected} actualizado(s), ${skipped} omitido(s)`);
    return {
      documentsAffected: affected,
      skipped,
      details: ["Marcador de versión modules.menu — sin transformación de datos aún"],
    };
  },
};
