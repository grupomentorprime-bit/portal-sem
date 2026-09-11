import type { Db } from "mongodb";
import type { SiteConfig } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";
import {
  SEM_SITE_ID,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
} from "@/core/tenant/constants";
import type { SiteConfigDocument } from "@/core/tenant/types";

/**
 * Espeja el singleton cms_config hacia site_config (SEM 1:1).
 * No elimina el singleton — capa de compat (ADR-008 / SAAS-001).
 */
export async function mirrorLegacyConfigToSiteConfig(
  db: Db,
  config: SiteConfig,
  options?: { tenantId?: string; siteId?: string }
): Promise<void> {
  const tenantId = options?.tenantId?.trim() || config.institution.tenant?.trim() || SEM_TENANT_ID;
  const siteId = options?.siteId?.trim() || (tenantId === SEM_TENANT_ID ? SEM_SITE_ID : tenantId);
  const now = new Date().toISOString();

  const existing = await db
    .collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION)
    .findOne({ _id: siteId });

  const document: SiteConfigDocument = {
    _id: siteId,
    tenantId,
    siteId,
    legacyConfigId: SITE_CONFIG_ID,
    schemaVersion: config.schemaVersion,
    modules: config.modules,
    institution: {
      ...config.institution,
      tenant: tenantId,
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
    createdAt: existing?.createdAt ?? config.createdAt ?? now,
    updatedAt: now,
  };

  await db
    .collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION)
    .replaceOne({ _id: siteId }, document, { upsert: true });
}
