import type { Db } from "mongodb";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import {
  ADL_DEV_HOST_DEFAULT,
  ADL_SITE_CODE,
  ADL_SITE_ID,
  ADL_TENANT_CODE,
  ADL_TENANT_ID,
  SITE_CONFIG_COLLECTION,
} from "@/core/tenant/constants";
import { applyAdlSiteIdentity } from "@/core/tenant/adl-site-identity";
import {
  buildProvisionedSiteConfigDocument,
  provisionTenantFoundation,
  type TenantProvisionHost,
  type TenantProvisionResult,
} from "@/core/tenant/provision";
import type { SiteConfigDocument } from "@/core/tenant/types";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import { SITE_CONFIG_ID } from "@/types/cms";
import {
  buildPlatformSubdomainHost,
  normalizeHost,
  resolveAppHostsFromEnv,
} from "@/core/tenant/hosts";
import { findDomainByHost } from "@/core/tenant/repositories";

const DEFAULT_BOOTSTRAP_MEMBER_EMAIL = "soporte@mentorprime.cl";

export type AdlFoundationResult = TenantProvisionResult;

function uniqueHosts(hosts: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of hosts) {
    const host = normalizeHost(raw);
    if (!host || seen.has(host)) continue;
    seen.add(host);
    out.push(host);
  }
  return out;
}

/**
 * Hosts de desarrollo de T002.
 * Nunca reutiliza el origen canónico de app (APP_URL) ni un host ya tomado.
 */
export async function resolveAdlDevHosts(
  db: Db,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): Promise<TenantProvisionHost[]> {
  // APP_URL = origen de plataforma; no debe quedar como Domain de ADL.
  const platformAppHosts = new Set(resolveAppHostsFromEnv(env));
  const explicit = env.ADL_DEV_HOST?.trim() || "";
  const platform = buildPlatformSubdomainHost(ADL_TENANT_ID, { env });
  const candidates = uniqueHosts([
    explicit || ADL_DEV_HOST_DEFAULT,
    platform,
    ADL_DEV_HOST_DEFAULT,
  ]);

  const hosts: TenantProvisionHost[] = [];
  for (const host of candidates) {
    if (platformAppHosts.has(host)) continue;
    const taken = await findDomainByHost(db, host);
    if (taken && taken.tenantId !== ADL_TENANT_ID) continue;
    const kind =
      platform && host === platform ? "platform_subdomain" : "custom";
    hosts.push({
      host,
      kind,
      isPrimary: hosts.length === 0,
    });
  }
  return hosts;
}

export function resolveAdlBootstrapMemberEmail(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  return (
    env.ADL_BOOTSTRAP_MEMBER_EMAIL?.trim().toLowerCase() ||
    DEFAULT_BOOTSTRAP_MEMBER_EMAIL
  );
}

/**
 * Fundación ADL (T002 / S002) — idempotente y separada del pack SEM.
 * Reutiliza provisionTenantFoundation + site_config / domains / menús de plataforma.
 */
export async function ensureAdlTenantFoundation(
  db: Db,
  options?: { env?: NodeJS.ProcessEnv | Record<string, string | undefined> }
): Promise<AdlFoundationResult> {
  const env = options?.env ?? process.env;
  const hosts = await resolveAdlDevHosts(db, env);
  const base = createDefaultSiteConfig();
  const config = applyAdlSiteIdentity({
    ...base,
    institution: {
      ...base.institution,
      tenant: ADL_TENANT_ID,
    },
  });

  const result = await provisionTenantFoundation(db, {
    tenantId: ADL_TENANT_ID,
    code: ADL_TENANT_CODE,
    name: config.institution.name,
    type: "academy",
    organization: config.institution.organization,
    website: config.institution.website || undefined,
    siteId: ADL_SITE_ID,
    siteCode: ADL_SITE_CODE,
    siteName: config.institution.shortName,
    hosts,
    config,
    seedMenus: true,
    seedHomePage: true,
    seedRoles: true,
    seedStorageStub: true,
    membershipEmail: resolveAdlBootstrapMemberEmail(env),
  });

  const identitySynced = await syncAdlSiteConfigIdentity(db);
  if (identitySynced) {
    result.updated.siteConfig = true;
  }

  return result;
}

/**
 * Si S002 ya existía con paleta de plataforma, escribe la identidad ADL.
 * No pisa colores/nombre personalizados distintos de la plantilla.
 */
async function syncAdlSiteConfigIdentity(db: Db): Promise<boolean> {
  const col = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);
  const existing = await col.findOne({ _id: ADL_SITE_ID, tenantId: ADL_TENANT_ID });
  if (!existing) return false;

  const current = normalizeSiteConfig({
    ...existing,
    _id: SITE_CONFIG_ID,
  } as import("@/types/cms").SiteConfig);
  if (!current) return false;

  const filled = applyAdlSiteIdentity(current);
  const changed =
    filled.branding.primaryColor !== current.branding.primaryColor ||
    filled.branding.secondaryColor !== current.branding.secondaryColor ||
    filled.institution.name !== current.institution.name ||
    filled.seo.title !== current.seo.title;
  if (!changed) return false;

  const at = new Date().toISOString();
  await col.replaceOne(
    { _id: ADL_SITE_ID },
    buildProvisionedSiteConfigDocument(filled, ADL_TENANT_ID, ADL_SITE_ID, existing, at)
  );
  return true;
}
