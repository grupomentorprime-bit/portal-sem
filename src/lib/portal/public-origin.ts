import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  SEM_SITE_ID,
  SEM_TENANT_ID,
  buildDefaultSpaceHost,
  findDefaultSiteForTenant,
  findPrimaryDomainBySiteId,
  publicOriginFromHost,
} from "@/core/tenant";

/**
 * Origen público del Espacio (dominio principal, o el subdominio por defecto).
 * El admin vive en el host de la plataforma; «Ver sitio» no puede usar ese origen.
 */
export async function resolvePublicOriginForTenant(
  tenantId: string | null | undefined
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
  const fromPrimary = publicOriginFromHost(primary?.host);
  if (fromPrimary) return fromPrimary;

  const slug = site?.slug?.trim() || siteId;
  return publicOriginFromHost(buildDefaultSpaceHost(slug));
}
