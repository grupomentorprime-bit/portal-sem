import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  SEM_SITE_ID,
  SEM_TENANT_ID,
  findDefaultSiteForTenant,
  findPrimaryDomainBySiteId,
  resolveSpacePreviewOrigin,
} from "@/core/tenant";

/**
 * Origen de «Vista previa».
 * El admin vive en el host de la plataforma; el enlace abre el Espacio.
 * En local abre `{slug}.localhost`. En el sistema público, el dominio principal.
 */
export async function resolvePublicOriginForTenant(
  tenantId: string | null | undefined,
  options?: { requestHost?: string | null }
): Promise<string | null> {
  const trimmed = tenantId?.trim();
  if (!trimmed || trimmed === "default") return null;

  const db = await getDatabase();
  const site = await findDefaultSiteForTenant(db, trimmed);
  const siteId =
    site?.siteId?.trim() ||
    site?._id ||
    (trimmed === SEM_TENANT_ID ? SEM_SITE_ID : trimmed);

  const primary = await findPrimaryDomainBySiteId(db, siteId);
  const slug = site?.slug?.trim() || siteId;
  return resolveSpacePreviewOrigin({
    slug,
    primaryHost: primary?.host,
    requestHost: options?.requestHost,
  });
}
