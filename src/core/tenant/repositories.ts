import type { Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "@/core/tenant/constants";
import { normalizeHost } from "@/core/tenant/hosts";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "@/core/tenant/types";

export async function listTenants(db: Db): Promise<TenantDocument[]> {
  return db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({})
    .sort({ name: 1 })
    .toArray();
}

export async function findTenantById(
  db: Db,
  tenantId: string
): Promise<TenantDocument | null> {
  return db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({
    $or: [{ _id: tenantId }, { tenantId }],
  });
}

export async function findTenantBySlug(
  db: Db,
  slug: string
): Promise<TenantDocument | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  return db.collection<TenantDocument>(TENANTS_COLLECTION).findOne({
    $or: [{ slug: normalized }, { tenantId: normalized }, { _id: normalized }],
  });
}

export async function findSiteById(
  db: Db,
  siteId: string
): Promise<SiteDocument | null> {
  return db.collection<SiteDocument>(SITES_COLLECTION).findOne({
    $or: [{ _id: siteId }, { siteId }],
  });
}

export async function findDefaultSiteForTenant(
  db: Db,
  tenantId: string
): Promise<SiteDocument | null> {
  return db.collection<SiteDocument>(SITES_COLLECTION).findOne({
    tenantId,
    isDefault: true,
  });
}

export async function findSitesByTenantId(
  db: Db,
  tenantId: string
): Promise<SiteDocument[]> {
  return db
    .collection<SiteDocument>(SITES_COLLECTION)
    .find({ tenantId })
    .sort({ isDefault: -1, name: 1 })
    .toArray();
}

export async function findDomainsByTenantId(
  db: Db,
  tenantId: string
): Promise<DomainDocument[]> {
  return db
    .collection<DomainDocument>(DOMAINS_COLLECTION)
    .find({ tenantId })
    .toArray();
}

export async function findDomainByHost(
  db: Db,
  host: string
): Promise<DomainDocument | null> {
  const normalized = normalizeHost(host) ?? host.trim().toLowerCase();
  if (!normalized) return null;
  return db.collection<DomainDocument>(DOMAINS_COLLECTION).findOne({
    $or: [{ _id: normalized }, { host: normalized }],
  });
}

export async function findDomainsBySiteId(
  db: Db,
  siteId: string
): Promise<DomainDocument[]> {
  return db
    .collection<DomainDocument>(DOMAINS_COLLECTION)
    .find({ siteId })
    .toArray();
}

export async function findPrimaryDomainBySiteId(
  db: Db,
  siteId: string
): Promise<DomainDocument | null> {
  return db.collection<DomainDocument>(DOMAINS_COLLECTION).findOne({
    siteId,
    isPrimary: true,
  });
}

export async function findSiteConfigBySiteId(
  db: Db,
  siteId: string
): Promise<SiteConfigDocument | null> {
  return db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION).findOne({
    $or: [{ _id: siteId }, { siteId }],
  });
}
