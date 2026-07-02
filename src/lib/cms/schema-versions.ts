/** Versión del documento cms_config (estructura global con bloque `modules`) */
export const SITE_CONFIG_SCHEMA_VERSION = 2 as const;

/** Versiones objetivo por módulo — incrementar al añadir una migración */
export const MODULE_VERSIONS = {
  heroPortal: 2,
  branding: 1,
  menu: 1,
  footer: 1,
  content: 1,
} as const;

export type ConfigModuleName = keyof typeof MODULE_VERSIONS;

export interface SiteConfigModuleVersion {
  version: number;
}

export interface SiteConfigModules {
  heroPortal: SiteConfigModuleVersion;
  branding: SiteConfigModuleVersion;
  menu: SiteConfigModuleVersion;
  footer: SiteConfigModuleVersion;
  content: SiteConfigModuleVersion;
}

export function createDefaultSiteConfigModules(): SiteConfigModules {
  return {
    heroPortal: { version: MODULE_VERSIONS.heroPortal },
    branding: { version: MODULE_VERSIONS.branding },
    menu: { version: MODULE_VERSIONS.menu },
    footer: { version: MODULE_VERSIONS.footer },
    content: { version: MODULE_VERSIONS.content },
  };
}
