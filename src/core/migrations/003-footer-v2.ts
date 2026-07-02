import { MODULE_VERSIONS } from "@/lib/cms/schema-versions";
import { bumpConfigModuleForAllTenants } from "@/core/migrations/config-helpers";
import type { MigrationDefinition } from "@/core/migrations/types";

/** Placeholder — reservado para footer institucional administrable */
export const migration003FooterV2: MigrationDefinition = {
  id: "003-footer-v2",
  description: "Footer — inicialización de versión de módulo",
  modules: ["footer"],

  async run({ db, log }) {
    const { affected, skipped } = await bumpConfigModuleForAllTenants(
      db,
      "footer",
      MODULE_VERSIONS.footer
    );
    log(`003-footer-v2: ${affected} actualizado(s), ${skipped} omitido(s)`);
    return {
      documentsAffected: affected,
      skipped,
      details: ["Marcador de versión modules.footer — sin transformación de datos aún"],
    };
  },
};
