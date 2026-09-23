import type { Db } from "mongodb";
import { DOMAINS_COLLECTION } from "@/core/tenant/constants";
import { isReservedPlatformHost, normalizeHost } from "@/core/tenant/hosts";
import {
  findDomainByHost,
  findDomainsBySiteId,
  findPrimaryDomainBySiteId,
  findSiteById,
} from "@/core/tenant/repositories";
import type { DomainDocument, DomainKind } from "@/core/tenant/types";

export type DomainMutationFailureReason =
  | "invalid_host"
  | "host_taken"
  | "site_not_found"
  | "tenant_site_mismatch"
  | "domain_not_found"
  | "domain_site_mismatch";

export interface DomainMutationSuccess {
  ok: true;
  domain: DomainDocument;
  /** Dominios del Site tras la operación (orden: primary primero). */
  domains: DomainDocument[];
}

export interface DomainMutationFailure {
  ok: false;
  reason: DomainMutationFailureReason;
  host?: string | null;
  conflictSiteId?: string;
  conflictTenantId?: string;
}

export type DomainMutationResult = DomainMutationSuccess | DomainMutationFailure;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function domainsCol(db: Db) {
  return db.collection<DomainDocument>(DOMAINS_COLLECTION);
}

async function listSorted(db: Db, siteId: string): Promise<DomainDocument[]> {
  const list = await findDomainsBySiteId(db, siteId);
  return list.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.host.localeCompare(b.host);
  });
}

async function clearPrimaryForSite(
  db: Db,
  siteId: string,
  exceptHost?: string
): Promise<void> {
  const filter: Record<string, unknown> = { siteId, isPrimary: true };
  if (exceptHost) filter.host = { $ne: exceptHost };
  await domainsCol(db).updateMany(filter, {
    $set: { isPrimary: false, updatedAt: nowIso() },
  });
}

/**
 * Unicidad global del host normalizado.
 * Si `excludeHost` está tomado por otro Site → conflicto.
 */
export async function assertHostAvailableForSite(
  db: Db,
  rawHost: string,
  siteId: string
): Promise<
  | { ok: true; host: string }
  | {
      ok: false;
      reason: "invalid_host" | "host_taken";
      host: string | null;
      conflictSiteId?: string;
      conflictTenantId?: string;
    }
> {
  const host = normalizeHost(rawHost);
  if (!host || isReservedPlatformHost(host)) {
    return { ok: false, reason: "invalid_host", host };
  }

  const existing = await findDomainByHost(db, host);
  if (existing && existing.siteId !== siteId) {
    return {
      ok: false,
      reason: "host_taken",
      host,
      conflictSiteId: existing.siteId,
      conflictTenantId: existing.tenantId,
    };
  }

  return { ok: true, host };
}

export function buildDomainRecord(input: {
  host: string;
  tenantId: string;
  siteId: string;
  isPrimary: boolean;
  kind?: DomainKind;
  existing?: DomainDocument | null;
  at?: string;
}): DomainDocument {
  const at = input.at ?? nowIso();
  const host = input.host.trim().toLowerCase();
  return {
    _id: host,
    host,
    tenantId: input.tenantId,
    siteId: input.siteId,
    isPrimary: input.isPrimary,
    kind: input.kind ?? input.existing?.kind ?? "custom",
    createdAt: input.existing?.createdAt ?? at,
    updatedAt: at,
  };
}

/**
 * Alta de dominio (principal o alias) para un Site.
 * - Host normalizado único global.
 * - Primer dominio del Site → siempre primary.
 * - Si `isPrimary`, demota el primary anterior del mismo Site.
 */
export async function addDomainToSite(
  db: Db,
  input: {
    host: string;
    siteId: string;
    tenantId?: string;
    isPrimary?: boolean;
    kind?: DomainKind;
  }
): Promise<DomainMutationResult> {
  const site = await findSiteById(db, input.siteId);
  if (!site) {
    return { ok: false, reason: "site_not_found", host: normalizeHost(input.host) };
  }

  const tenantId = input.tenantId?.trim() || site.tenantId;
  if (tenantId !== site.tenantId) {
    return {
      ok: false,
      reason: "tenant_site_mismatch",
      host: normalizeHost(input.host),
    };
  }

  const availability = await assertHostAvailableForSite(db, input.host, site.siteId);
  if (!availability.ok) {
    return {
      ok: false,
      reason: availability.reason,
      host: availability.host,
      conflictSiteId: availability.conflictSiteId,
      conflictTenantId: availability.conflictTenantId,
    };
  }

  const host = availability.host;
  const existingSame = await findDomainByHost(db, host);
  if (existingSame && existingSame.siteId === site.siteId) {
    // Idempotente: ya pertenece a este Site.
    const siblings = await listSorted(db, site.siteId);
    const makePrimary =
      input.isPrimary === true ||
      (existingSame.isPrimary && input.isPrimary !== false);
    if (makePrimary && !existingSame.isPrimary) {
      return setPrimaryDomain(db, { host, siteId: site.siteId });
    }
    if (input.kind && input.kind !== existingSame.kind) {
      const at = nowIso();
      const updated = buildDomainRecord({
        host,
        tenantId: site.tenantId,
        siteId: site.siteId,
        isPrimary: existingSame.isPrimary,
        kind: input.kind,
        existing: existingSame,
        at,
      });
      await domainsCol(db).replaceOne({ _id: host }, updated);
      return { ok: true, domain: updated, domains: await listSorted(db, site.siteId) };
    }
    return {
      ok: true,
      domain: existingSame,
      domains: siblings,
    };
  }

  const current = await findDomainsBySiteId(db, site.siteId);
  const shouldBePrimary =
    current.length === 0 || input.isPrimary === true;

  const at = nowIso();
  if (shouldBePrimary) {
    await clearPrimaryForSite(db, site.siteId);
  }

  const domain = buildDomainRecord({
    host,
    tenantId: site.tenantId,
    siteId: site.siteId,
    isPrimary: shouldBePrimary,
    kind: input.kind ?? "custom",
    at,
  });

  try {
    await domainsCol(db).replaceOne({ _id: host }, domain, { upsert: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const conflict = await findDomainByHost(db, host);
      return {
        ok: false,
        reason: "host_taken",
        host,
        conflictSiteId: conflict?.siteId,
        conflictTenantId: conflict?.tenantId,
      };
    }
    throw error;
  }
  return {
    ok: true,
    domain,
    domains: await listSorted(db, site.siteId),
  };
}

/** Marca un dominio existente como único primary del Site. */
export async function setPrimaryDomain(
  db: Db,
  input: { host: string; siteId: string }
): Promise<DomainMutationResult> {
  const host = normalizeHost(input.host);
  if (!host) {
    return { ok: false, reason: "invalid_host", host: null };
  }

  const domain = await findDomainByHost(db, host);
  if (!domain) {
    return { ok: false, reason: "domain_not_found", host };
  }
  if (domain.siteId !== input.siteId) {
    return {
      ok: false,
      reason: "domain_site_mismatch",
      host,
      conflictSiteId: domain.siteId,
      conflictTenantId: domain.tenantId,
    };
  }

  const at = nowIso();
  await clearPrimaryForSite(db, input.siteId, host);
  const updated: DomainDocument = {
    ...domain,
    isPrimary: true,
    updatedAt: at,
  };
  await domainsCol(db).replaceOne({ _id: host }, updated);

  return {
    ok: true,
    domain: updated,
    domains: await listSorted(db, input.siteId),
  };
}

/**
 * Baja segura: elimina el host del Site.
 * Si era primary y quedan hermanos → promueve el primero (orden estable por host).
 */
export async function removeDomainFromSite(
  db: Db,
  input: { host: string; siteId: string }
): Promise<DomainMutationResult | { ok: true; domain: null; domains: DomainDocument[] }> {
  const host = normalizeHost(input.host);
  if (!host) {
    return { ok: false, reason: "invalid_host", host: null };
  }

  const domain = await findDomainByHost(db, host);
  if (!domain) {
    return { ok: false, reason: "domain_not_found", host };
  }
  if (domain.siteId !== input.siteId) {
    return {
      ok: false,
      reason: "domain_site_mismatch",
      host,
      conflictSiteId: domain.siteId,
      conflictTenantId: domain.tenantId,
    };
  }

  await domainsCol(db).deleteOne({ _id: domain._id });

  const remaining = await findDomainsBySiteId(db, input.siteId);
  if (domain.isPrimary && remaining.length > 0) {
    const next = [...remaining].sort((a, b) => a.host.localeCompare(b.host))[0]!;
    await setPrimaryDomain(db, { host: next.host, siteId: input.siteId });
  }

  return {
    ok: true,
    domain: null,
    domains: await listSorted(db, input.siteId),
  };
}

/**
 * Cambio seguro de host (mismo Site): renombra conservando kind/isPrimary.
 * El host nuevo debe estar libre globalmente.
 */
export async function changeDomainHost(
  db: Db,
  input: { siteId: string; fromHost: string; toHost: string }
): Promise<DomainMutationResult> {
  const fromHost = normalizeHost(input.fromHost);
  const toHost = normalizeHost(input.toHost);
  if (!fromHost || !toHost) {
    return { ok: false, reason: "invalid_host", host: toHost ?? fromHost };
  }
  if (fromHost === toHost) {
    const current = await findDomainByHost(db, fromHost);
    if (!current || current.siteId !== input.siteId) {
      return { ok: false, reason: "domain_not_found", host: fromHost };
    }
    return {
      ok: true,
      domain: current,
      domains: await listSorted(db, input.siteId),
    };
  }

  const existing = await findDomainByHost(db, fromHost);
  if (!existing) {
    return { ok: false, reason: "domain_not_found", host: fromHost };
  }
  if (existing.siteId !== input.siteId) {
    return {
      ok: false,
      reason: "domain_site_mismatch",
      host: fromHost,
      conflictSiteId: existing.siteId,
      conflictTenantId: existing.tenantId,
    };
  }

  const availability = await assertHostAvailableForSite(db, toHost, input.siteId);
  if (!availability.ok) {
    return {
      ok: false,
      reason: availability.reason,
      host: availability.host,
      conflictSiteId: availability.conflictSiteId,
      conflictTenantId: availability.conflictTenantId,
    };
  }

  // Si toHost ya es del mismo Site (otro doc), no permitir colisión.
  const sameSiteTarget = await findDomainByHost(db, availability.host);
  if (sameSiteTarget && sameSiteTarget.host !== fromHost) {
    return {
      ok: false,
      reason: "host_taken",
      host: availability.host,
      conflictSiteId: sameSiteTarget.siteId,
      conflictTenantId: sameSiteTarget.tenantId,
    };
  }

  const at = nowIso();
  const next = buildDomainRecord({
    host: availability.host,
    tenantId: existing.tenantId,
    siteId: existing.siteId,
    isPrimary: existing.isPrimary,
    kind: existing.kind,
    existing: { ...existing, host: availability.host, _id: availability.host },
    at,
  });

  await domainsCol(db).insertOne(next);
  await domainsCol(db).deleteOne({ _id: existing._id });

  return {
    ok: true,
    domain: next,
    domains: await listSorted(db, input.siteId),
  };
}

export async function listSiteDomains(
  db: Db,
  siteId: string
): Promise<DomainDocument[]> {
  return listSorted(db, siteId);
}

export async function getPrimaryDomain(
  db: Db,
  siteId: string
): Promise<DomainDocument | null> {
  return findPrimaryDomainBySiteId(db, siteId);
}

/** Garantiza índices de unicidad / lookup de domains (idempotente). */
export async function ensureDomainIndexes(db: Db): Promise<void> {
  await domainsCol(db).createIndex({ host: 1 }, { unique: true });
  await domainsCol(db).createIndex({ siteId: 1, isPrimary: 1 });
  await domainsCol(db).createIndex({ tenantId: 1, siteId: 1 });
}
