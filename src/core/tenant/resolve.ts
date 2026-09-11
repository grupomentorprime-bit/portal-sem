import type { Db } from "mongodb";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import { SITE_CONFIG_ID, type PortalStatus, type SiteConfig } from "@/types/cms";
import { SEM_SITE_ID, SEM_TENANT_ID } from "@/core/tenant/constants";
import { isLoopbackHost, normalizeHost } from "@/core/tenant/hosts";
import {
  findDomainByHost,
  findSiteById,
  findSiteConfigBySiteId,
  findTenantById,
} from "@/core/tenant/repositories";
import type { DomainDocument, SiteDocument, TenantDocument } from "@/core/tenant/types";

export type HostResolutionFailureReason =
  | "missing_host"
  | "unknown_host"
  | "missing_site"
  | "missing_tenant"
  | "missing_config"
  | "tenant_site_mismatch";

export type HostResolutionSource =
  | "domain"
  | "sem-app-url-compat"
  | "sem-legacy-singleton";

export interface HostResolutionSuccess {
  ok: true;
  host: string;
  tenantId: string;
  siteId: string;
  source: HostResolutionSource;
  tenant: TenantDocument;
  site: SiteDocument;
  domain: DomainDocument | null;
  config: SiteConfig;
  /** Estado efectivo del portal (tenant/site/config). */
  status: PortalStatus;
  tenantActive: boolean;
  siteActive: boolean;
}

export interface HostResolutionFailure {
  ok: false;
  reason: HostResolutionFailureReason;
  host: string | null;
  tenantId?: string;
  siteId?: string;
}

export type HostResolution = HostResolutionSuccess | HostResolutionFailure;

/**
 * TEMP (SAAS-002 / HOST-ISOLATION-001): hosts elegibles para SEM sin fila en `domains`.
 * Solo loopback (dev). APP_URL / NEXT_PUBLIC_APP_URL describen el origen de
 * plataforma y nunca otorgan identidad de tenant — aunque coincidan con el Host.
 */
export function isSemEligibleHost(
  host: string,
  _env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  void _env;
  return isLoopbackHost(host);
}

function derivePortalStatus(
  tenant: TenantDocument,
  site: SiteDocument,
  config: SiteConfig
): PortalStatus {
  if (tenant.status === "inactive" || tenant.status === "suspended") {
    return tenant.status === "suspended" ? "maintenance" : "inactive";
  }
  if (site.status === "inactive" || site.status === "maintenance") {
    return site.status;
  }
  return config.institution.status;
}

function siteConfigDocumentToSiteConfig(
  doc: Awaited<ReturnType<typeof findSiteConfigBySiteId>>
): SiteConfig | null {
  if (!doc) return null;
  return normalizeSiteConfig({
    ...doc,
    _id: SITE_CONFIG_ID,
    institution: {
      ...(doc.institution as SiteConfig["institution"]),
    },
  } as SiteConfig);
}

async function loadLegacySemConfig(db: Db): Promise<SiteConfig | null> {
  const legacy = await db
    .collection<SiteConfig>("cms_config")
    .findOne({ _id: SITE_CONFIG_ID });
  const normalized = normalizeSiteConfig(legacy);
  if (!normalized) return null;
  return {
    ...normalized,
    institution: {
      ...normalized.institution,
      tenant: normalized.institution.tenant?.trim() || SEM_TENANT_ID,
    },
  };
}

async function loadConfigForSite(
  db: Db,
  siteId: string,
  tenantId: string
): Promise<SiteConfig | null> {
  const fromSite = siteConfigDocumentToSiteConfig(
    await findSiteConfigBySiteId(db, siteId)
  );
  if (fromSite) {
    return {
      ...fromSite,
      institution: {
        ...fromSite.institution,
        tenant: fromSite.institution.tenant?.trim() || tenantId,
      },
    };
  }

  // TEMP: SEM 1:1 — si falta site_config, leer singleton cms_config.
  if (siteId === SEM_SITE_ID && tenantId === SEM_TENANT_ID) {
    return loadLegacySemConfig(db);
  }

  return null;
}

function syntheticSemTenant(config: SiteConfig, at: string): TenantDocument {
  return {
    _id: SEM_TENANT_ID,
    tenantId: SEM_TENANT_ID,
    code: "T001",
    name: config.institution.name || "SEM",
    slug: SEM_TENANT_ID,
    status:
      config.institution.status === "inactive"
        ? "inactive"
        : config.institution.status === "maintenance"
          ? "suspended"
          : "active",
    type: "institution",
    defaultSiteId: SEM_SITE_ID,
    organization: config.institution.organization || undefined,
    website: config.institution.website || undefined,
    createdAt: config.createdAt || at,
    updatedAt: at,
  };
}

function syntheticSemSite(config: SiteConfig, at: string): SiteDocument {
  return {
    _id: SEM_SITE_ID,
    siteId: SEM_SITE_ID,
    tenantId: SEM_TENANT_ID,
    code: "S001",
    name: config.institution.shortName || config.institution.name || "SEM",
    slug: SEM_SITE_ID,
    status: config.institution.status,
    isDefault: true,
    createdAt: config.createdAt || at,
    updatedAt: at,
  };
}

/**
 * TEMP: foundation incompleta pero cms_config SEM existe → servir T001
 * solo para hosts elegibles SEM (nunca para host desconocido).
 */
async function resolveSemFromLegacySingleton(
  db: Db,
  host: string
): Promise<HostResolution | null> {
  const config = await loadLegacySemConfig(db);
  if (!config || config.institution.tenant !== SEM_TENANT_ID) {
    return null;
  }

  const at = new Date().toISOString();
  const tenant = syntheticSemTenant(config, at);
  const site = syntheticSemSite(config, at);
  const boundConfig: SiteConfig = {
    ...config,
    institution: {
      ...config.institution,
      tenant: SEM_TENANT_ID,
    },
  };

  return {
    ok: true,
    host,
    tenantId: SEM_TENANT_ID,
    siteId: SEM_SITE_ID,
    source: "sem-legacy-singleton",
    tenant,
    site,
    domain: null,
    config: boundConfig,
    status: boundConfig.institution.status,
    tenantActive: tenant.status === "active",
    siteActive: site.status === "active",
  };
}

async function finishResolution(input: {
  db: Db;
  host: string;
  tenantId: string;
  siteId: string;
  source: HostResolutionSource;
  domain: DomainDocument | null;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}): Promise<HostResolution> {
  const { db, host, tenantId, siteId, source, domain, env } = input;

  const [tenant, site] = await Promise.all([
    findTenantById(db, tenantId),
    findSiteById(db, siteId),
  ]);

  if (!site || !tenant) {
    if (
      tenantId === SEM_TENANT_ID &&
      siteId === SEM_SITE_ID &&
      isSemEligibleHost(host, env)
    ) {
      const legacy = await resolveSemFromLegacySingleton(db, host);
      if (legacy) return legacy;
    }
    if (!site) {
      return { ok: false, reason: "missing_site", host, tenantId, siteId };
    }
    return { ok: false, reason: "missing_tenant", host, tenantId, siteId };
  }

  if (site.tenantId !== tenant.tenantId) {
    return {
      ok: false,
      reason: "tenant_site_mismatch",
      host,
      tenantId,
      siteId,
    };
  }

  const config = await loadConfigForSite(db, site.siteId, tenant.tenantId);
  if (!config) {
    if (
      tenant.tenantId === SEM_TENANT_ID &&
      site.siteId === SEM_SITE_ID &&
      isSemEligibleHost(host, env)
    ) {
      const legacy = await resolveSemFromLegacySingleton(db, host);
      if (legacy) return legacy;
    }
    return {
      ok: false,
      reason: "missing_config",
      host,
      tenantId: tenant.tenantId,
      siteId: site.siteId,
    };
  }

  // Forzar tenant del documento resuelto — no confiar en config huérfana.
  const boundConfig: SiteConfig = {
    ...config,
    institution: {
      ...config.institution,
      tenant: tenant.tenantId,
      status: derivePortalStatus(tenant, site, config),
    },
  };

  const status = boundConfig.institution.status;
  const tenantActive = tenant.status === "active";
  const siteActive = site.status === "active";

  return {
    ok: true,
    host,
    tenantId: tenant.tenantId,
    siteId: site.siteId,
    source,
    tenant,
    site,
    domain,
    config: boundConfig,
    status,
    tenantActive,
    siteActive,
  };
}

async function resolveDb(db?: Db): Promise<Db> {
  if (db) return db;
  const { getDatabase } = await import("@/lib/mongodb");
  return getDatabase();
}

/**
 * Resuelve Host → Domain → Site → Tenant → site_config.
 * Host desconocido → failure (sin fallback a otro tenant).
 */
export async function resolvePublicTenantByHost(
  rawHost: string | null | undefined,
  options?: {
    db?: Db;
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  }
): Promise<HostResolution> {
  const host = normalizeHost(rawHost);
  if (!host) {
    return { ok: false, reason: "missing_host", host: null };
  }

  const db = await resolveDb(options?.db);
  const domain = await findDomainByHost(db, host);

  if (domain) {
    return finishResolution({
      db,
      host,
      tenantId: domain.tenantId,
      siteId: domain.siteId,
      source: "domain",
      domain,
      env: options?.env,
    });
  }

  // TEMP compat SEM: solo loopback sin fila en domains (nunca host de APP_URL público).
  if (isSemEligibleHost(host, options?.env)) {
    return finishResolution({
      db,
      host,
      tenantId: SEM_TENANT_ID,
      siteId: SEM_SITE_ID,
      source: "sem-app-url-compat",
      domain: null,
      env: options?.env,
    });
  }

  return { ok: false, reason: "unknown_host", host };
}

/** ¿El resolution puede servir portal “activo”? */
export function isHostResolutionPortalActive(
  resolution: HostResolutionSuccess
): boolean {
  return (
    resolution.tenantActive &&
    resolution.siteActive &&
    resolution.status === "active"
  );
}
