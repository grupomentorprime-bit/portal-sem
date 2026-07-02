import type { Branding } from "@/types/cms";
import {
  isLegacyHeroPortal,
  migrateHeroPortalToV2,
} from "@/lib/cms/hero-portal-migrate-v2";
import { MODULE_VERSIONS } from "@/lib/cms/schema-versions";
import {
  bumpModuleVersion,
  getModules,
  getTenantLabel,
  loadAllCmsConfigs,
  updateCmsConfigModules,
} from "@/core/migrations/config-helpers";
import type { MigrationDefinition, MigrationRunResult } from "@/core/migrations/types";

async function stripNestedHeroSchemaVersion(
  db: Parameters<MigrationDefinition["run"]>[0]["db"]
): Promise<void> {
  const configs = await loadAllCmsConfigs(db);
  for (const config of configs) {
    const hp = config.heroPortal;
    if (!hp || typeof hp !== "object" || !("schemaVersion" in hp)) continue;

    const { schemaVersion: _removed, ...heroPortal } = hp as Record<string, unknown>;
    await db.collection("cms_config").updateOne(
      { _id: config._id } as Record<string, string>,
      { $set: { heroPortal } }
    );
  }
}

export const migration001HeroV2: MigrationDefinition = {
  id: "001-hero-v2",
  description: "Hero Portal — esquema v2 anidado (content, multimedia, publication)",
  modules: ["heroPortal"],

  async run({ db, log }): Promise<MigrationRunResult> {
    const configs = await loadAllCmsConfigs(db);
    const details: string[] = [];
    let affected = 0;
    let skipped = 0;

    for (const config of configs) {
      const configId = String(config._id);
      const tenant = getTenantLabel(config);
      const modules = getModules(config);
      const heroModuleVersion = modules.heroPortal.version;
      const targetVersion = MODULE_VERSIONS.heroPortal;

      if (!config.heroPortal) {
        if (heroModuleVersion >= targetVersion) {
          skipped += 1;
          details.push(`[${configId}] ${tenant} — sin heroPortal, omitido`);
          continue;
        }

        const modulesNext = bumpModuleVersion(modules, "heroPortal", targetVersion);
        await updateCmsConfigModules(db, configId, modulesNext);
        affected += 1;
        details.push(`[${configId}] ${tenant} — modules.heroPortal → v${targetVersion}`);
        continue;
      }

      const legacy = isLegacyHeroPortal(config.heroPortal, heroModuleVersion);

      if (!legacy && heroModuleVersion >= targetVersion) {
        skipped += 1;
        const slideCount = Array.isArray(
          (config.heroPortal as { slides?: unknown[] }).slides
        )
          ? (config.heroPortal as { slides: unknown[] }).slides.length
          : 0;
        details.push(
          `[${configId}] ${tenant} — ya en hero v${targetVersion} (${slideCount} slides)`
        );
        continue;
      }

      const branding = (config.branding ?? {}) as unknown as Branding;
      const heroPortal = migrateHeroPortalToV2(config.heroPortal, branding);
      const modulesNext = bumpModuleVersion(modules, "heroPortal", targetVersion);

      await updateCmsConfigModules(db, configId, modulesNext, { heroPortal });
      affected += 1;
      details.push(
        `[${configId}] ${tenant} — migrado hero v${targetVersion} (${heroPortal.slides.length} slides)`
      );
    }

    log(`001-hero-v2: ${affected} actualizado(s), ${skipped} omitido(s)`);
    await stripNestedHeroSchemaVersion(db);
    return { documentsAffected: affected, skipped, details };
  },
};
