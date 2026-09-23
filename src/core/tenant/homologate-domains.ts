import type { Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SITES_COLLECTION,
} from "@/core/tenant/constants";
import {
  addDomainToSite,
  setPrimaryDomain,
} from "@/core/tenant/domains";
import {
  buildDefaultSpaceHost,
  isBarePlatformOriginHost,
  isDevLoopbackSpaceHost,
  isPlatformSubdomainHost,
} from "@/core/tenant/hosts";
import { findDomainsBySiteId } from "@/core/tenant/repositories";
import type { DomainDocument, SiteDocument } from "@/core/tenant/types";

export interface HomologateSiteDomainsResult {
  siteId: string;
  tenantId: string;
  defaultHost: string | null;
  removed: string[];
  relabeled: string[];
  created: boolean;
  primaryHost: string | null;
}

export interface HomologateAllDomainsResult {
  sites: number;
  created: number;
  relabeled: number;
  removed: number;
  primariesSet: number;
  details: HomologateSiteDomainsResult[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function domainsCol(db: Db) {
  return db.collection<DomainDocument>(DOMAINS_COLLECTION);
}

/**
 * Homologa los dominios de un Sitio:
 * - Quita el origen pelado de plataforma (`localhost`) si quedó como Domain.
 * - Garantiza `{slug}.{base}` / `{slug}.localhost:{puerto}` como `platform_subdomain`.
 * - Conserva un dominio propio ya marcado como principal.
 */
export async function homologateSitePlatformDomain(
  db: Db,
  site: Pick<SiteDocument, "siteId" | "tenantId" | "slug">,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): Promise<HomologateSiteDomainsResult> {
  const siteId = site.siteId;
  const tenantId = site.tenantId;
  const slug = (site.slug || site.siteId).trim();
  const defaultHost = buildDefaultSpaceHost(slug, { env });
  const at = nowIso();

  const result: HomologateSiteDomainsResult = {
    siteId,
    tenantId,
    defaultHost,
    removed: [],
    relabeled: [],
    created: false,
    primaryHost: null,
  };

  const current = await findDomainsBySiteId(db, siteId);
  const loopback = current.filter((domain) =>
    isBarePlatformOriginHost(domain.host)
  );

  if (loopback.length > 0) {
    await domainsCol(db).deleteMany({
      siteId,
      host: { $in: loopback.map((domain) => domain.host) },
    });
    result.removed = loopback.map((domain) => domain.host);
  }

  let remaining = await findDomainsBySiteId(db, siteId);

  for (const domain of remaining) {
    if (!isPlatformSubdomainHost(slug, domain.host, { env })) continue;
    if (domain.kind === "platform_subdomain") continue;
    await domainsCol(db).updateOne(
      { _id: domain._id, siteId, tenantId },
      { $set: { kind: "platform_subdomain", updatedAt: at } }
    );
    result.relabeled.push(domain.host);
  }

  if (defaultHost) {
    const existing = remaining.find((domain) => domain.host === defaultHost);
    if (!existing) {
      const taken = await domainsCol(db).findOne({ host: defaultHost });
      if (!taken || taken.siteId === siteId) {
        const added = await addDomainToSite(db, {
          host: defaultHost,
          siteId,
          tenantId,
          isPrimary: remaining.length === 0,
          kind: "platform_subdomain",
        });
        if (added.ok) {
          result.created = true;
        }
      }
    }
  }

  remaining = await findDomainsBySiteId(db, siteId);
  let primary = remaining.find((domain) => domain.isPrimary) ?? null;

  // El subdominio público del wildcard sustituye a `{slug}.localhost` como
  // dirección principal. Un dominio propio ya primario se conserva.
  const publicDefault =
    defaultHost && !isDevLoopbackSpaceHost(defaultHost)
      ? remaining.find((domain) => domain.host === defaultHost) ?? null
      : null;
  if (publicDefault && primary && isDevLoopbackSpaceHost(primary.host)) {
    const promoted = await setPrimaryDomain(db, {
      host: publicDefault.host,
      siteId,
    });
    if (promoted.ok) {
      result.primaryHost = promoted.domain.host;
      return result;
    }
  }

  if (!primary && remaining.length > 0) {
    const platform =
      remaining.find((domain) => domain.host === defaultHost) ??
      remaining.find((domain) =>
        isPlatformSubdomainHost(slug, domain.host, { env })
      ) ??
      remaining[0]!;
    const promoted = await setPrimaryDomain(db, {
      host: platform.host,
      siteId,
    });
    if (promoted.ok) {
      result.primaryHost = promoted.domain.host;
    }
  } else {
    result.primaryHost = primary?.host ?? null;
  }

  return result;
}

/** Recorre todos los Sitios. Idempotente. */
export async function homologateAllPlatformDomains(
  db: Db,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): Promise<HomologateAllDomainsResult> {
  const sites = await db
    .collection<SiteDocument>(SITES_COLLECTION)
    .find({})
    .toArray();

  const details: HomologateSiteDomainsResult[] = [];
  for (const site of sites) {
    details.push(await homologateSitePlatformDomain(db, site, env));
  }

  return {
    sites: details.length,
    created: details.filter((row) => row.created).length,
    relabeled: details.reduce((sum, row) => sum + row.relabeled.length, 0),
    removed: details.reduce((sum, row) => sum + row.removed.length, 0),
    primariesSet: details.filter((row) => Boolean(row.primaryHost)).length,
    details,
  };
}
