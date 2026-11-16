import { cache } from "react";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { normalizeSiteConfig } from "@/lib/cms/normalize";
import { fillBlankSeo, mergeSiteConfigPatch, type SiteConfigPatch } from "@/lib/cms/site-config-patch";
import { validateSiteConfigUpdate, type ValidationError } from "@/lib/cms/validation";
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

export type SiteConfigWriteResult =
  | { ok: true; config: SiteConfig }
  | { ok: false; code: "missing" }
  | { ok: false; code: "invalid"; errors: ValidationError[] }
  | { ok: false; code: "conflict" };

function asSiteConfigUpdate(config: SiteConfig): SiteConfigUpdate {
  const { _id, createdAt, updatedAt, ...update } = config;
  void _id;
  void createdAt;
  void updatedAt;
  return update;
}

const SITE_CONFIG_WRITE_ATTEMPTS = 3;

/**
 * Actualiza site_config del Espacio indicado.
 * Exige `tenantId` explícito — no hay fallback silencioso a SEM.
 * El cuerpo puede ser la ficha completa o solo los campos de una sección.
 * Cada intento relee la ficha y combina el parche, así un guardado no pisa
 * SEO, imágenes ni cambios que llegaron después de abrir el formulario.
 */
export async function updateSiteConfig(
  update: SiteConfigPatch,
  options: { tenantId: string }
): Promise<SiteConfigWriteResult> {
  const db = await getDatabase();
  const tenantId = options.tenantId?.trim();
  if (!tenantId) {
    return { ok: false, code: "missing" };
  }

  const isSem = tenantId === SEM_TENANT_ID;
  const defaultSite = isSem ? null : await findDefaultSiteForTenant(db, tenantId);
  const siteId = isSem
    ? SEM_SITE_ID
    : defaultSite?.siteId?.trim() || defaultSite?._id || tenantId;

  for (let attempt = 0; attempt < SITE_CONFIG_WRITE_ATTEMPTS; attempt += 1) {
    const existing = await getSiteConfigForTenant(tenantId);
    if (!existing) {
      return { ok: false, code: "missing" };
    }

    const now = new Date().toISOString();
    const merged = fillBlankSeo(mergeSiteConfigPatch(existing, update));
    merged.institution = { ...merged.institution, tenant: tenantId };
    merged.createdAt = existing.createdAt;
    merged.updatedAt = now;

    const document = normalizeSiteConfig(merged);
    if (!document) {
      return { ok: false, code: "missing" };
    }

    const errors = validateSiteConfigUpdate(asSiteConfigUpdate(document));
    if (errors.length > 0) {
      return { ok: false, code: "invalid", errors };
    }

    const row = await findSiteConfigBySiteId(db, siteId);
    let wrote = false;
    try {
      if (!row) {
        wrote = await mirrorLegacyConfigToSiteConfig(db, document, { tenantId, siteId });
      } else if (row.updatedAt !== existing.updatedAt) {
        wrote = false;
      } else {
        wrote = await mirrorLegacyConfigToSiteConfig(db, document, {
          tenantId,
          siteId,
          expectedUpdatedAt: row.updatedAt,
        });
      }
    } catch {
      // SEM sigue en el singleton si la capa site_config aún no está reparada.
      if (!isSem) throw new Error("No se pudo guardar la ficha del Espacio.");
      await writeSemSingleton(db, document);
      revalidateTag(CMS_CONFIG_TAG, "max");
      revalidatePath("/", "layout");
      return { ok: true, config: document };
    }

    if (!wrote) continue;

    if (isSem) {
      await writeSemSingleton(db, document);
    }

    revalidateTag(CMS_CONFIG_TAG, "max");
    revalidatePath("/", "layout");
    return { ok: true, config: document };
  }

  return { ok: false, code: "conflict" };
}

async function writeSemSingleton(db: Awaited<ReturnType<typeof getDatabase>>, document: SiteConfig) {
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
