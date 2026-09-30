import type { Db } from "mongodb";
import type { IdentityAuditEntry } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";
import {
  DOMAINS_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "@/core/tenant/constants";
import {
  addDomainToSite,
  removeDomainFromSite,
  setPrimaryDomain,
} from "@/core/tenant/domains";
import {
  buildDefaultSpaceHost,
  isLoopbackHost,
  isPlatformOriginHost,
  isReservedPlatformHost,
  isReservedSpaceSlug,
  normalizeHost,
  normalizePlatformHostSlug,
  resolveAppHostsFromEnv,
  resolvePlatformBaseDomain,
} from "@/core/tenant/hosts";
import {
  findDefaultSiteForTenant,
  findDomainsBySiteId,
  findTenantById,
} from "@/core/tenant/repositories";
import {
  customDomainCnameTarget,
  customDomainDnsRecords,
  customDomainHostSet,
  type CustomDomainDnsRecord,
} from "@/core/tenant/custom-domain-records";
import type { DomainDocument, SiteDocument, TenantDocument } from "@/core/tenant/types";

const PLATFORM_DNS_TARGET = "growthos.mentorprime.cl";

export type SetSpaceCustomDomainErrorCode =
  | "space_not_found"
  | "site_not_found"
  | "invalid_host"
  | "reserved_host"
  | "foreign_subdomain"
  | "host_taken";

export class SetSpaceCustomDomainError extends Error {
  readonly code: SetSpaceCustomDomainErrorCode;
  readonly status: number;

  constructor(
    code: SetSpaceCustomDomainErrorCode,
    message: string,
    status = 400
  ) {
    super(message);
    this.name = "SetSpaceCustomDomainError";
    this.code = code;
    this.status = status;
  }
}

export interface SetSpaceCustomDomainResult {
  tenantId: string;
  subdomain: string | null;
  customDomain: string | null;
  customHosts: string[];
  detachedHosts: string[];
  primaryHost: string | null;
  dnsTarget: string;
  records: CustomDomainDnsRecord[];
}

type CustomDomainIntent = { action: "clear" } | { action: "set"; host: string };

/** Host público de la plataforma. El dominio de un cliente usa un CNAME, no la IP del servidor. */
export function customDomainDnsTarget(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  for (const host of resolveAppHostsFromEnv(env)) {
    if (isLoopbackHost(host)) continue;
    const hostname = host.split(":")[0]?.trim();
    if (hostname) return hostname;
  }
  return PLATFORM_DNS_TARGET;
}

function platformSubdomainLabel(
  hostname: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>
): string | null {
  const base = resolvePlatformBaseDomain(env);
  if (base && hostname.endsWith(`.${base}`)) {
    const label = hostname.slice(0, -(base.length + 1));
    if (label && !label.includes(".")) return label;
  }
  if (hostname.endsWith(".localhost")) {
    const label = hostname.slice(0, -".localhost".length);
    if (label && !label.includes(".")) return label;
  }
  return null;
}

/**
 * Vacío o el subdominio del propio Espacio vuelven a la dirección de plataforma.
 * Un host con punto que no sea de otro Espacio ni de infraestructura se guarda como dominio propio.
 */
export function interpretCustomDomainInput(
  tenantSlug: string,
  rawHost: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): CustomDomainIntent {
  const trimmed = rawHost.trim();
  if (!trimmed) return { action: "clear" };

  const host = normalizeHost(trimmed);
  const hostname = host?.split(":")[0] ?? "";
  if (!host || host !== hostname || !hostname.includes(".") || isLoopbackHost(host)) {
    throw new SetSpaceCustomDomainError(
      "invalid_host",
      "Escribe un dominio válido, por ejemplo www.cliente.cl."
    );
  }

  if (isReservedPlatformHost(host, { env }) || isPlatformOriginHost(host, env)) {
    throw new SetSpaceCustomDomainError(
      "reserved_host",
      "Ese dominio pertenece a la plataforma o al servidor."
    );
  }

  const label = platformSubdomainLabel(hostname, env);
  if (label) {
    if (isReservedSpaceSlug(label, env)) {
      throw new SetSpaceCustomDomainError(
        "reserved_host",
        "Ese dominio pertenece a la plataforma o al servidor."
      );
    }
    const slug = normalizePlatformHostSlug(tenantSlug);
    if (slug && label === slug) return { action: "clear" };
    throw new SetSpaceCustomDomainError(
      "foreign_subdomain",
      "Ese subdominio corresponde a otro Espacio."
    );
  }

  return { action: "set", host: hostname };
}

function primaryHostOf(domains: DomainDocument[]): string | null {
  return domains.find((domain) => domain.isPrimary)?.host ?? domains[0]?.host ?? null;
}

function customHostOf(domains: DomainDocument[]): string | null {
  return (
    domains.find((domain) => domain.kind === "custom" && domain.isPrimary)?.host ??
    domains.find((domain) => domain.kind === "custom")?.host ??
    null
  );
}

async function ensurePlatformSubdomain(
  db: Db,
  tenant: TenantDocument,
  site: SiteDocument
): Promise<string | null> {
  const existing = await findDomainsBySiteId(db, site.siteId);
  const current = existing.find((domain) => domain.kind === "platform_subdomain");
  if (current) return current.host;

  const subdomain = buildDefaultSpaceHost(tenant.slug || tenant.tenantId);
  if (!subdomain) return null;
  const added = await addDomainToSite(db, {
    host: subdomain,
    siteId: site.siteId,
    tenantId: tenant.tenantId,
    kind: "platform_subdomain",
    isPrimary: false,
  });
  if (!added.ok && added.reason === "host_taken") {
    throw new SetSpaceCustomDomainError(
      "host_taken",
      "El subdominio de este Espacio ya está usado por otro.",
      409
    );
  }
  if (!added.ok) {
    throw new SetSpaceCustomDomainError(
      "invalid_host",
      "No se pudo conservar el subdominio del Espacio."
    );
  }
  return subdomain;
}

async function removeCustomDomains(
  db: Db,
  siteId: string,
  keepHosts: ReadonlySet<string>
): Promise<string[]> {
  const domains = await findDomainsBySiteId(db, siteId);
  const removed: string[] = [];
  for (const domain of domains) {
    if (domain.kind !== "custom") continue;
    if (keepHosts.has(domain.host)) continue;
    removed.push(domain.host);
    await removeDomainFromSite(db, { host: domain.host, siteId });
  }
  return removed;
}

/**
 * Actualiza el dominio propio de un Espacio ya creado.
 * El subdominio `{slug}` se conserva. Vacío devuelve la dirección pública al subdominio.
 */
export async function setSpaceCustomDomain(
  db: Db,
  input: { tenantId: string; host: string; actorUserId: string }
): Promise<SetSpaceCustomDomainResult> {
  const tenantId = input.tenantId.trim();
  if (!tenantId) {
    throw new SetSpaceCustomDomainError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const tenant = await findTenantById(db, tenantId);
  if (!tenant) {
    throw new SetSpaceCustomDomainError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const site = await findDefaultSiteForTenant(db, tenantId);
  if (!site) {
    throw new SetSpaceCustomDomainError(
      "site_not_found",
      "Este Espacio no tiene sitio."
    );
  }

  const intent = interpretCustomDomainInput(tenant.slug || tenant.tenantId, input.host);
  const subdomain = await ensurePlatformSubdomain(db, tenant, site);
  const dnsTarget = customDomainCnameTarget();
  let detachedHosts: string[] = [];

  if (intent.action === "clear") {
    detachedHosts = await removeCustomDomains(db, site.siteId, new Set());
    if (subdomain) {
      const promoted = await setPrimaryDomain(db, {
        host: subdomain,
        siteId: site.siteId,
      });
      if (!promoted.ok) {
        throw new SetSpaceCustomDomainError(
          "invalid_host",
          "No se pudo dejar el subdominio como dirección principal."
        );
      }
    }
  } else {
    const names = customDomainHostSet(intent.host);
    for (const host of names.hosts) {
      const companion = interpretCustomDomainInput(
        tenant.slug || tenant.tenantId,
        host
      );
      if (companion.action !== "set") {
        throw new SetSpaceCustomDomainError(
          "invalid_host",
          "Ese dominio no se puede conectar a este Espacio."
        );
      }
    }
    detachedHosts = await removeCustomDomains(db, site.siteId, new Set(names.hosts));
    for (const host of names.hosts) {
      const added = await addDomainToSite(db, {
        host,
        siteId: site.siteId,
        tenantId: tenant.tenantId,
        kind: "custom",
        isPrimary: host === names.canonical,
      });
      if (!added.ok && added.reason !== "host_taken") {
        throw new SetSpaceCustomDomainError(
          "invalid_host",
          "No se pudo guardar el dominio."
        );
      }
      if (!added.ok && added.reason === "host_taken") {
        const sameSite = added.conflictSiteId === site.siteId;
        if (!sameSite) {
          throw new SetSpaceCustomDomainError(
            "host_taken",
            "Ese dominio ya está usado por otro Espacio.",
            409
          );
        }
      }
    }
  }

  const domains = await findDomainsBySiteId(db, site.siteId);
  const customDomain = customHostOf(domains);
  const customHosts = domains
    .filter((domain) => domain.kind === "custom")
    .map((domain) => domain.host);
  const primaryHost = primaryHostOf(domains);
  const at = new Date().toISOString();
  const entry: IdentityAuditEntry = {
    _id: generateId("audit"),
    userId: input.actorUserId,
    action: "platform.space.domain",
    entity: "tenant",
    entityId: tenantId,
    metadata: {
      name: tenant.name,
      subdomain,
      customDomain,
      primaryHost,
    },
    scope: "platform",
    createdAt: at,
  };
  await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);

  return {
    tenantId,
    subdomain,
    customDomain,
    customHosts,
    detachedHosts,
    primaryHost,
    dnsTarget,
    records: customDomain
      ? customDomainDnsRecords(customDomain, dnsTarget)
      : [],
  };
}

/** Respuesta al navegador: sin la IP de origen ni los registros que la contienen. */
export function publicSpaceDomainResult(
  domain: SetSpaceCustomDomainResult
): Omit<SetSpaceCustomDomainResult, "dnsTarget" | "records"> {
  return {
    tenantId: domain.tenantId,
    subdomain: domain.subdomain,
    customDomain: domain.customDomain,
    customHosts: domain.customHosts,
    detachedHosts: domain.detachedHosts,
    primaryHost: domain.primaryHost,
  };
}

export async function readSpaceDomainHosts(
  db: Db,
  tenantId: string
): Promise<{ subdomain: string | null; customDomain: string | null }> {
  const tenant = await db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({
    tenantId,
  });
  if (!tenant) return { subdomain: null, customDomain: null };
  const site = await db.collection<SiteDocument>(SITES_COLLECTION).findOne({
    tenantId,
    isDefault: true,
  });
  if (!site) return { subdomain: null, customDomain: null };
  const domains = await db
    .collection<DomainDocument>(DOMAINS_COLLECTION)
    .find({ siteId: site.siteId })
    .toArray();
  return {
    subdomain:
      domains.find((domain) => domain.kind === "platform_subdomain")?.host ??
      buildDefaultSpaceHost(tenant.slug || tenant.tenantId),
    customDomain: customHostOf(domains),
  };
}
