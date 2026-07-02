import type { Db } from "mongodb";
import {
  bumpModuleVersion,
  normalizeSiteConfigModules,
  normalizeSiteConfigSchemaVersion,
} from "@/lib/cms/normalize-modules";
import {
  MODULE_VERSIONS,
  SITE_CONFIG_SCHEMA_VERSION,
  type ConfigModuleName,
  type SiteConfigModules,
} from "@/lib/cms/schema-versions";

export interface RawCmsConfigDocument {
  _id: string;
  institution?: { tenant?: string };
  branding?: Record<string, unknown>;
  heroPortal?: unknown;
  modules?: unknown;
  schemaVersion?: number;
  updatedAt?: string;
  [key: string]: unknown;
}

export async function loadAllCmsConfigs(db: Db): Promise<RawCmsConfigDocument[]> {
  return db
    .collection<RawCmsConfigDocument>("cms_config")
    .find({})
    .toArray() as Promise<RawCmsConfigDocument[]>;
}

export function getTenantLabel(config: RawCmsConfigDocument): string {
  return config.institution?.tenant ?? "(sin tenant)";
}

export function getModules(config: RawCmsConfigDocument): SiteConfigModules {
  return normalizeSiteConfigModules(config.modules);
}

export async function updateCmsConfigModules(
  db: Db,
  configId: string,
  modules: SiteConfigModules,
  extraSet: Record<string, unknown> = {}
): Promise<void> {
  const now = new Date().toISOString();
  await db.collection("cms_config").updateOne(
    { _id: configId } as Record<string, string>,
    {
      $set: {
        schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
        modules,
        updatedAt: now,
        ...extraSet,
      },
    }
  );
}

export interface MigrationCounters {
  affected: number;
  skipped: number;
}

export async function bumpConfigModuleForAllTenants(
  db: Db,
  module: ConfigModuleName,
  version: number,
  extraPerConfig?: (
    config: RawCmsConfigDocument
  ) => Record<string, unknown> | Promise<Record<string, unknown>>
): Promise<MigrationCounters> {
  const configs = await loadAllCmsConfigs(db);
  let affected = 0;
  let skipped = 0;

  for (const config of configs) {
    const current = getModules(config);
    if (current[module].version >= version) {
      skipped += 1;
      continue;
    }

    const modules = bumpModuleVersion(current, module, version);
    const extra = extraPerConfig ? await extraPerConfig(config) : {};
    await updateCmsConfigModules(db, String(config._id), modules, extra);
    affected += 1;
  }

  return { affected, skipped };
}

export function isConfigAtSiteSchemaV2(config: RawCmsConfigDocument): boolean {
  return normalizeSiteConfigSchemaVersion(config) >= SITE_CONFIG_SCHEMA_VERSION;
}

export { bumpModuleVersion, MODULE_VERSIONS, SITE_CONFIG_SCHEMA_VERSION };
