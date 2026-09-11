/** Tenant 001 — SEM productivo (ADR-008). */
export const SEM_TENANT_ID = "seminario-ipn" as const;
export const SEM_TENANT_CODE = "T001" as const;

/** Site principal 1:1 de SEM (S001). */
export const SEM_SITE_ID = "seminario-ipn" as const;
export const SEM_SITE_CODE = "S001" as const;

/** Tenant 002 — Academia ADL (ADR-008). IDs de datos, no ramas de runtime. */
export const ADL_TENANT_ID = "adl" as const;
export const ADL_TENANT_CODE = "T002" as const;

/** Site principal 1:1 de ADL (S002). */
export const ADL_SITE_ID = "adl" as const;
export const ADL_SITE_CODE = "S002" as const;

/** Host de desarrollo por defecto de S002. No coincide con APP_URL / SEM. */
export const ADL_DEV_HOST_DEFAULT = "adl.localhost:3000" as const;

export const TENANTS_COLLECTION = "tenants" as const;
export const SITES_COLLECTION = "sites" as const;
export const DOMAINS_COLLECTION = "domains" as const;
/** Config de portal por Site (ex cms_config singleton). */
export const SITE_CONFIG_COLLECTION = "site_config" as const;
