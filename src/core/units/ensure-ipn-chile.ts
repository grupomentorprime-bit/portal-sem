import type { Db } from "mongodb";
import type { IdentityMembership } from "@/types/identity";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import {
  buildDefaultSpaceHost,
  buildPlatformSubdomainHost,
  classifySpaceDomainKind,
  isBarePlatformOriginHost,
  normalizeHost,
  resolveAppHostsFromEnv,
} from "@/core/tenant/hosts";
import { findDomainByHost } from "@/core/tenant/repositories";
import {
  provisionTenantFoundation,
  type TenantProvisionHost,
  type TenantProvisionResult,
} from "@/core/tenant/provision";
import { ensureOrgUnitIndexes, findOrgUnit, insertOrgUnit } from "@/core/units/repository";
import {
  IPN_CHILE_DEV_HOST_DEFAULT,
  IPN_CHILE_TENANT_ID,
  ipnChileFoundationSpec,
} from "@/core/units/ipn-chile";

const DEFAULT_BOOTSTRAP_MEMBER_EMAIL = "soporte@mentorprime.cl";

export interface IpnChileFoundationResult extends TenantProvisionResult {
  unitId: string;
  unitCreated: boolean;
}

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

async function resolveIpnHosts(
  db: Db,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>
): Promise<TenantProvisionHost[]> {
  const platformAppHosts = new Set(resolveAppHostsFromEnv(env));
  const explicit = env.IPN_DEV_HOST?.trim() || "";
  const candidates = uniqueHosts([
    explicit || IPN_CHILE_DEV_HOST_DEFAULT,
    buildDefaultSpaceHost(IPN_CHILE_TENANT_ID, { env }),
    buildPlatformSubdomainHost(IPN_CHILE_TENANT_ID, { env }),
    IPN_CHILE_DEV_HOST_DEFAULT,
  ]);

  const hosts: TenantProvisionHost[] = [];
  for (const host of candidates) {
    if (isBarePlatformOriginHost(host)) continue;
    if (platformAppHosts.has(host)) continue;
    const taken = await findDomainByHost(db, host);
    if (taken && taken.tenantId !== IPN_CHILE_TENANT_ID) continue;
    hosts.push({
      host,
      kind: classifySpaceDomainKind(IPN_CHILE_TENANT_ID, host, { env }),
      isPrimary: hosts.length === 0,
    });
  }
  return hosts;
}

/**
 * Alta idempotente de IPN Chile y del Departamento Nacional de Varones.
 * Solo escribe el tenant `ipn-chile` y su unidad. No toca otros Espacios.
 */
export async function ensureIpnChileFoundation(
  db: Db,
  options?: { env?: NodeJS.ProcessEnv | Record<string, string | undefined> }
): Promise<IpnChileFoundationResult> {
  const env = options?.env ?? process.env;
  const spec = ipnChileFoundationSpec();
  const hosts = await resolveIpnHosts(db, env);
  const base = createDefaultSiteConfig();
  const config = {
    ...base,
    institution: {
      ...base.institution,
      name: spec.name,
      shortName: spec.siteName,
      tenant: spec.tenantId,
      organization: spec.organization,
      website: "",
      tagline: "",
      status: "active" as const,
    },
    seo: {
      ...base.seo,
      title: spec.name,
      description: "",
      keywords: [] as string[],
    },
  };

  const membershipEmail =
    env.IPN_BOOTSTRAP_MEMBER_EMAIL?.trim().toLowerCase() || DEFAULT_BOOTSTRAP_MEMBER_EMAIL;

  const result = await provisionTenantFoundation(db, {
    tenantId: spec.tenantId,
    code: spec.code,
    name: spec.name,
    slug: spec.slug,
    type: spec.type,
    organization: spec.organization,
    siteId: spec.siteId,
    siteCode: spec.siteId,
    siteName: spec.siteName,
    hosts,
    config,
    seedMenus: true,
    seedHomePage: true,
    seedRoles: true,
    seedStorageStub: true,
    membershipEmail,
  });

  const now = new Date().toISOString();
  await db.collection<IdentityMembership>("identity_memberships").updateMany(
    { tenantId: spec.tenantId, unitAccess: { $exists: false } },
    { $set: { unitAccess: { mode: "tenant" }, updatedAt: now } }
  );

  await ensureOrgUnitIndexes(db);
  const existingUnit = await findOrgUnit(db, spec.tenantId, spec.unit.unitId);
  let unitCreated = false;
  if (!existingUnit) {
    await insertOrgUnit(db, {
      tenantId: spec.tenantId,
      unitId: spec.unit.unitId,
      name: spec.unit.name,
      kind: spec.unit.kind,
      enabledAppIds: spec.unit.enabledAppIds,
    });
    unitCreated = true;
  }

  return { ...result, unitId: spec.unit.unitId, unitCreated };
}
