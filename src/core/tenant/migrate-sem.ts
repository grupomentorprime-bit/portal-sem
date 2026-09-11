import type { Db } from "mongodb";
import { SITE_CONFIG_ID, type SiteConfig } from "@/types/cms";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import {
  DOMAINS_COLLECTION,
  SEM_SITE_CODE,
  SEM_SITE_ID,
  SEM_TENANT_CODE,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "@/core/tenant/constants";
import { rewriteLegacyPlatformProductName } from "@/core/branding/display";
import { applySemSiteIdentity, SEM_SITE_IDENTITY } from "@/core/tenant/sem-site-identity";
import { resolveSemBootstrapHostsFromEnv } from "@/core/tenant/hosts";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "@/core/tenant/types";

export interface SemFoundationResult {
  tenantId: string;
  siteId: string;
  hosts: string[];
  created: {
    tenant: boolean;
    site: boolean;
    domains: number;
    siteConfig: boolean;
  };
  updated: {
    tenant: boolean;
    site: boolean;
    domains: number;
    siteConfig: boolean;
    legacyCmsConfig: boolean;
    menusBackfilled: number;
  };
  preserved: {
    legacyCmsConfig: boolean;
    brandingPrimaryColor?: string;
    institutionName?: string;
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapPortalStatusToTenant(
  status: string | undefined
): TenantDocument["status"] {
  if (status === "inactive") return "inactive";
  if (status === "maintenance") return "suspended";
  return "active";
}

function mapPortalStatusToSite(
  status: string | undefined
): SiteDocument["status"] {
  if (status === "inactive") return "inactive";
  if (status === "maintenance") return "maintenance";
  return "active";
}

export function buildSemTenantDocument(
  config: SiteConfig | null,
  existing: TenantDocument | null,
  at: string
): TenantDocument {
  const name =
    config?.institution.name?.trim() ||
    existing?.name ||
    "Seminario Eclesiástico Mayor";
  const organization =
    config?.institution.organization?.trim() || existing?.organization || "";
  const website =
    config?.institution.website?.trim() || existing?.website || "";

  return {
    _id: SEM_TENANT_ID,
    tenantId: SEM_TENANT_ID,
    code: SEM_TENANT_CODE,
    name,
    slug: SEM_TENANT_ID,
    status: mapPortalStatusToTenant(config?.institution.status),
    type: existing?.type ?? "institution",
    defaultSiteId: SEM_SITE_ID,
    organization: organization || undefined,
    website: website || undefined,
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
}

export function buildSemSiteDocument(
  config: SiteConfig | null,
  existing: SiteDocument | null,
  at: string
): SiteDocument {
  const fromConfig =
    config?.institution.shortName?.trim() || config?.institution.name?.trim();
  const existingName = existing?.name?.trim() ?? "";
  const existingIsLegacyProduct =
    existingName.length > 0 &&
    rewriteLegacyPlatformProductName(existingName) !== existingName;
  const name =
    fromConfig ||
    (existingIsLegacyProduct ? "" : existingName) ||
    SEM_SITE_IDENTITY.institution.name;

  return {
    _id: SEM_SITE_ID,
    siteId: SEM_SITE_ID,
    tenantId: SEM_TENANT_ID,
    code: SEM_SITE_CODE,
    name,
    slug: SEM_SITE_ID,
    status: mapPortalStatusToSite(config?.institution.status),
    isDefault: true,
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
}

export function buildDomainDocument(
  host: string,
  isPrimary: boolean,
  existing: DomainDocument | null,
  at: string
): DomainDocument {
  const normalized = host.trim().toLowerCase();
  return {
    _id: normalized,
    host: normalized,
    tenantId: SEM_TENANT_ID,
    siteId: SEM_SITE_ID,
    isPrimary,
    kind: existing?.kind ?? "legacy",
    createdAt: existing?.createdAt ?? at,
    updatedAt: at,
  };
}

export function buildSiteConfigDocument(
  config: SiteConfig,
  existing: SiteConfigDocument | null,
  at: string
): SiteConfigDocument {
  return {
    _id: SEM_SITE_ID,
    tenantId: SEM_TENANT_ID,
    siteId: SEM_SITE_ID,
    legacyConfigId: SITE_CONFIG_ID,
    schemaVersion: config.schemaVersion,
    modules: config.modules,
    institution: {
      ...config.institution,
      tenant: SEM_TENANT_ID,
    },
    branding: config.branding,
    heroPortal: config.heroPortal,
    seo: config.seo,
    contact: config.contact,
    social: config.social,
    features: config.features,
    portalCopy: config.portalCopy,
    topBar: config.topBar,
    portalExperience: config.portalExperience,
    createdAt: existing?.createdAt ?? config.createdAt ?? at,
    updatedAt: at,
  };
}

async function ensureIndexes(db: Db): Promise<void> {
  await db.collection(TENANTS_COLLECTION).createIndex({ tenantId: 1 }, { unique: true });
  await db.collection(SITES_COLLECTION).createIndex({ siteId: 1 }, { unique: true });
  await db.collection(SITES_COLLECTION).createIndex(
    { tenantId: 1, slug: 1 },
    { unique: true }
  );
  await db.collection(DOMAINS_COLLECTION).createIndex({ host: 1 }, { unique: true });
  await db.collection(DOMAINS_COLLECTION).createIndex({ tenantId: 1, siteId: 1 });
  await db.collection(SITE_CONFIG_COLLECTION).createIndex(
    { tenantId: 1, siteId: 1 },
    { unique: true }
  );
}

/**
 * Fundación SEM (T001 / S001 / Domain) — idempotente.
 * No elimina el singleton `cms_config` `_id: "site"`.
 */
export async function ensureSemTenantFoundation(
  db: Db,
  options?: {
    hosts?: string[];
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  }
): Promise<SemFoundationResult> {
  const at = nowIso();
  const hosts = options?.hosts?.length
    ? options.hosts.map((h) => h.trim().toLowerCase()).filter(Boolean)
    : resolveSemBootstrapHostsFromEnv(options?.env ?? process.env);

  await ensureIndexes(db);

  const legacyRaw = await db
    .collection<SiteConfig>("cms_config")
    .findOne({ _id: SITE_CONFIG_ID });
  const legacyConfig = normalizeSiteConfig(legacyRaw);

  const tenantCol = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const siteCol = db.collection<SiteDocument>(SITES_COLLECTION);
  const domainCol = db.collection<DomainDocument>(DOMAINS_COLLECTION);
  const siteConfigCol = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);

  const existingTenant = await tenantCol.findOne({ _id: SEM_TENANT_ID });
  const tenantDoc = buildSemTenantDocument(legacyConfig, existingTenant, at);
  const tenantWrite = await tenantCol.replaceOne(
    { _id: SEM_TENANT_ID },
    tenantDoc,
    { upsert: true }
  );

  const existingSite = await siteCol.findOne({ _id: SEM_SITE_ID });
  const siteDoc = buildSemSiteDocument(legacyConfig, existingSite, at);
  const siteWrite = await siteCol.replaceOne(
    { _id: SEM_SITE_ID },
    siteDoc,
    { upsert: true }
  );

  let domainsCreated = 0;
  let domainsUpdated = 0;
  const existingPrimary = await domainCol.findOne({
    siteId: SEM_SITE_ID,
    isPrimary: true,
  });
  for (let i = 0; i < hosts.length; i += 1) {
    const host = hosts[i]!;
    const existingDomain = await domainCol.findOne({ _id: host });
    const isPrimary = existingDomain
      ? Boolean(existingDomain.isPrimary)
      : !existingPrimary && i === 0;
    const domainDoc = buildDomainDocument(host, isPrimary, existingDomain, at);
    const write = await domainCol.replaceOne({ _id: host }, domainDoc, {
      upsert: true,
    });
    if (write.upsertedCount > 0) domainsCreated += 1;
    else if (write.modifiedCount > 0) domainsUpdated += 1;
  }

  let siteConfigCreated = false;
  let siteConfigUpdated = false;
  const configForSite = legacyConfig
    ? applySemSiteIdentity(legacyConfig)
    : null;
  if (configForSite) {
    const existingSiteConfig = await siteConfigCol.findOne({ _id: SEM_SITE_ID });
    const siteConfigDoc = buildSiteConfigDocument(
      configForSite,
      existingSiteConfig,
      at
    );
    const write = await siteConfigCol.replaceOne(
      { _id: SEM_SITE_ID },
      siteConfigDoc,
      { upsert: true }
    );
    siteConfigCreated = write.upsertedCount > 0;
    siteConfigUpdated = write.modifiedCount > 0;
  }

  let legacyCmsConfigUpdated = false;
  if (legacyRaw) {
    const patch = await db.collection<SiteConfig>("cms_config").updateOne(
      { _id: SITE_CONFIG_ID },
      {
        $set: {
          tenantId: SEM_TENANT_ID,
          siteId: SEM_SITE_ID,
          "institution.tenant": SEM_TENANT_ID,
          updatedAt: at,
        } as Partial<SiteConfig> & { tenantId: string; siteId: string },
      }
    );
    legacyCmsConfigUpdated = patch.modifiedCount > 0;
  }

  const menusResult = await db.collection("cms_menus").updateMany(
    {
      $or: [
        { tenant: { $exists: false } },
        { tenant: null },
        { tenant: "" },
      ],
    } as Record<string, unknown>,
    { $set: { tenant: SEM_TENANT_ID, updatedAt: at } }
  );

  return {
    tenantId: SEM_TENANT_ID,
    siteId: SEM_SITE_ID,
    hosts,
    created: {
      tenant: tenantWrite.upsertedCount > 0,
      site: siteWrite.upsertedCount > 0,
      domains: domainsCreated,
      siteConfig: siteConfigCreated,
    },
    updated: {
      tenant: tenantWrite.modifiedCount > 0,
      site: siteWrite.modifiedCount > 0,
      domains: domainsUpdated,
      siteConfig: siteConfigUpdated,
      legacyCmsConfig: legacyCmsConfigUpdated,
      menusBackfilled: menusResult.modifiedCount,
    },
    preserved: {
      legacyCmsConfig: Boolean(legacyRaw),
      brandingPrimaryColor: configForSite?.branding.primaryColor,
      institutionName: configForSite?.institution.name,
    },
  };
}

/**
 * Escribe la identidad visual SEM en T001/S001 (campos vacíos).
 * Idempotente: no pisa valores ya configurados.
 */
export async function materializeSemSiteIdentity(db: Db): Promise<{
  filled: boolean;
  created: boolean;
  updated: boolean;
  legacyUpdated: boolean;
  config: SiteConfig;
}> {
  const at = nowIso();
  const legacyRaw = await db
    .collection<SiteConfig>("cms_config")
    .findOne({ _id: SITE_CONFIG_ID });
  const base = normalizeSiteConfig(legacyRaw) ?? createDefaultSiteConfig();
  const filled = applySemSiteIdentity({
    ...base,
    institution: {
      ...base.institution,
      tenant: SEM_TENANT_ID,
    },
  });

  const identityChanged =
    filled.institution.name !== base.institution.name ||
    filled.institution.shortName !== base.institution.shortName ||
    filled.branding.logo !== base.branding.logo ||
    filled.branding.favicon !== base.branding.favicon ||
    filled.branding.secondaryLogo !== base.branding.secondaryLogo ||
    filled.seo.title !== base.seo.title ||
    filled.contact.email !== base.contact.email ||
    filled.social.facebook !== base.social.facebook ||
    filled.topBar.email !== base.topBar.email;

  const cmsCol = db.collection<SiteConfig>("cms_config");
  let legacyUpdated = false;
  if (!legacyRaw) {
    const insert = await cmsCol.insertOne({
      ...filled,
      tenantId: SEM_TENANT_ID,
      siteId: SEM_SITE_ID,
      updatedAt: at,
    } as SiteConfig & { tenantId: string; siteId: string });
    legacyUpdated = Boolean(insert.insertedId);
  } else {
    const cmsWrite = await cmsCol.updateOne(
      { _id: SITE_CONFIG_ID },
      {
        $set: {
          institution: filled.institution,
          branding: filled.branding,
          seo: filled.seo,
          contact: filled.contact,
          social: filled.social,
          topBar: filled.topBar,
          tenantId: SEM_TENANT_ID,
          siteId: SEM_SITE_ID,
          updatedAt: at,
        } as Partial<SiteConfig> & { tenantId: string; siteId: string },
      }
    );
    legacyUpdated = cmsWrite.modifiedCount > 0;
  }

  const siteConfigCol = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);
  const existingSiteConfig = await siteConfigCol.findOne({ _id: SEM_SITE_ID });
  const siteConfigDoc = buildSiteConfigDocument(
    filled,
    existingSiteConfig,
    at
  );
  const siteWrite = await siteConfigCol.replaceOne(
    { _id: SEM_SITE_ID },
    siteConfigDoc,
    { upsert: true }
  );

  const tenantCol = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const existingTenant = await tenantCol.findOne({ _id: SEM_TENANT_ID });
  if (existingTenant) {
    await tenantCol.updateOne(
      { _id: SEM_TENANT_ID },
      {
        $set: {
          name: filled.institution.name,
          organization: filled.institution.organization || undefined,
          website: filled.institution.website || undefined,
          updatedAt: at,
        },
      }
    );
  }

  const siteCol = db.collection<SiteDocument>(SITES_COLLECTION);
  const existingSite = await siteCol.findOne({ _id: SEM_SITE_ID });
  if (existingSite) {
    await siteCol.updateOne(
      { _id: SEM_SITE_ID },
      {
        $set: {
          name:
            filled.institution.shortName ||
            filled.institution.name ||
            existingSite.name,
          updatedAt: at,
        },
      }
    );
  }

  return {
    filled: identityChanged || !legacyRaw || siteWrite.upsertedCount > 0,
    created: siteWrite.upsertedCount > 0,
    updated: siteWrite.modifiedCount > 0,
    legacyUpdated,
    config: filled,
  };
}
