import {
  createDefaultSiteConfigModules,
  MODULE_VERSIONS,
  SITE_CONFIG_SCHEMA_VERSION,
  type SiteConfigModules,
} from "@/lib/cms/schema-versions";

export function normalizeSiteConfigModules(raw: unknown): SiteConfigModules {
  const defaults = createDefaultSiteConfigModules();
  if (!raw || typeof raw !== "object") return defaults;

  const modules = raw as Partial<SiteConfigModules>;

  return {
    heroPortal: {
      version:
        typeof modules.heroPortal?.version === "number"
          ? modules.heroPortal.version
          : defaults.heroPortal.version,
    },
    branding: {
      version:
        typeof modules.branding?.version === "number"
          ? modules.branding.version
          : defaults.branding.version,
    },
    menu: {
      version:
        typeof modules.menu?.version === "number"
          ? modules.menu.version
          : defaults.menu.version,
    },
    footer: {
      version:
        typeof modules.footer?.version === "number"
          ? modules.footer.version
          : defaults.footer.version,
    },
    content: {
      version:
        typeof modules.content?.version === "number"
          ? modules.content.version
          : defaults.content.version,
    },
  };
}

export function normalizeSiteConfigSchemaVersion(raw: unknown): number {
  if (raw && typeof raw === "object" && typeof (raw as { schemaVersion?: number }).schemaVersion === "number") {
    return (raw as { schemaVersion: number }).schemaVersion;
  }
  return SITE_CONFIG_SCHEMA_VERSION;
}

export function bumpModuleVersion(
  modules: SiteConfigModules,
  module: keyof typeof MODULE_VERSIONS,
  version: number
): SiteConfigModules {
  return {
    ...modules,
    [module]: { version },
  };
}
