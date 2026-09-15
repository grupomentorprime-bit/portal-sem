import { cache } from "react";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import { SEM_SITE_ID, SEM_TENANT_ID } from "@/core/tenant/constants";
import { resolveRequestHost } from "@/core/tenant/hosts";
import {
  findDefaultSiteForTenant,
  findSiteConfigBySiteId,
} from "@/core/tenant/repositories";
import { resolvePublicTenantByHost } from "@/core/tenant/resolve";
import { mirrorLegacyConfigToSiteConfig } from "@/core/tenant/site-config-mirror";
import type { SiteConfig, SiteConfigUpdate } from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";
import type { SiteConfigDocument } from "@/core/tenant/types";

const CMS_CONFIG_TAG = "cms-config";

function siteConfigFromDocument(
  doc: SiteConfigDocument | null,
  tenantFallback?: string
): SiteConfig | null {
  if (!doc) return null;
  const normalized = normalizeSiteConfig({
    ...doc,
    _id: SITE_CONFIG_ID,
  } as SiteConfig);
  if (!normalized) return null;
  const tenant =
    normalized.institution.tenant?.trim() || tenantFallback?.trim() || "";
  return {
    ...normalized,
    institution: {
      ...normalized.institution,
      tenant,
    },
  };
}

async function tryReadRequestHost(): Promise<string | null> {
  try {
    const headerList = await headers();
    return resolveRequestHost(headerList);
  } catch {
    return null;
  }
}

/** Singleton cms_config + respaldo site_config SEM. Scripts / sin Host. */
export async function fetchLegacySingletonSiteConfig(): Promise<SiteConfig | null> {
  const db = await getDatabase();
  const raw = await db
    .collection<SiteConfig>("cms_config")
    .findOne({ _id: SITE_CONFIG_ID });

  const fromLegacy = normalizeSiteConfig(raw);
  if (fromLegacy) return fromLegacy;

  const siteScoped = await findSiteConfigBySiteId(db, SEM_SITE_ID);
  return siteConfigFromDocument(siteScoped, SEM_TENANT_ID);
}

export async function getSiteConfigForTenant(
  tenantId: string
): Promise<SiteConfig | null> {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;

  const db = await getDatabase();
  const defaultSite = await findDefaultSiteForTenant(db, trimmed);
  const siteId = defaultSite?.siteId?.trim() || defaultSite?._id || trimmed;
  const fromSite = siteConfigFromDocument(
    await findSiteConfigBySiteId(db, siteId),
    trimmed
  );
  if (fromSite) return fromSite;

  // TEMP (SAAS-002): T001 sin site_config → singleton.
  if (trimmed === SEM_TENANT_ID) {
    return fetchLegacySingletonSiteConfig();
  }

  return null;
}

async function fetchSiteConfigForRequest(): Promise<SiteConfig | null> {
  const host = await tryReadRequestHost();
  if (host) {
    const resolution = await resolvePublicTenantByHost(host);
    if (!resolution.ok) return null;
    return resolution.config;
  }

  return fetchLegacySingletonSiteConfig();
}

/**
 * Config del portal público: Host → site_config.
 * Sin Host de request (scripts): singleton legado.
 * Host desconocido: null (no cae a SEM).
 */
export const getSiteConfig = cache(fetchSiteConfigForRequest);

export async function getSiteConfigUncached(): Promise<SiteConfig | null> {
  return fetchSiteConfigForRequest();
}

/** Admin / APIs autenticadas: Espacio de sesión, si no host. */
export async function getOperationalSiteConfig(): Promise<SiteConfig | null> {
  const { loadSessionContext } = await import("@/lib/identity/sessions");
  const loaded = await loadSessionContext();
  const tenantId = loaded?.session.tenantId?.trim();
  if (tenantId && loaded?.membership) {
    const fromTenant = await getSiteConfigForTenant(tenantId);
    if (fromTenant) return fromTenant;
  }
  return fetchSiteConfigForRequest();
}

/**
 * Actualiza site_config del Espacio indicado.
 * Exige `tenantId` explícito — no hay fallback silencioso a SEM.
 */
export async function updateSiteConfig(
  update: SiteConfigUpdate,
  options: { tenantId: string }
): Promise<SiteConfig | null> {
  const db = await getDatabase();
  const tenantId = options.tenantId?.trim();
  if (!tenantId) {
    return null;
  }

  const existing = await getSiteConfigForTenant(tenantId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const merged = {
    ...existing,
    ...update,
    _id: SITE_CONFIG_ID,
    institution: {
      ...existing.institution,
      ...update.institution,
      tenant: tenantId,
    },
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  const document = normalizeSiteConfig(merged);
  if (!document) {
    return null;
  }

  const isSem = tenantId === SEM_TENANT_ID;
  const siteId = isSem ? SEM_SITE_ID : tenantId;

  if (isSem) {
    await db.collection<SiteConfig>("cms_config").replaceOne(
      { _id: SITE_CONFIG_ID },
      {
        ...document,
        tenantId: SEM_TENANT_ID,
        siteId: SEM_SITE_ID,
      } as SiteConfig & { tenantId: string; siteId: string },
      { upsert: true }
    );
  }

  try {
    await mirrorLegacyConfigToSiteConfig(db, document, {
      tenantId,
      siteId,
    });
  } catch {
    // La capa nueva se repara con la migración 006 / 009.
  }

  revalidateTag(CMS_CONFIG_TAG, "max");
  revalidatePath("/", "layout");

  return document;
}
