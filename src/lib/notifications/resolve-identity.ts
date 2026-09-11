import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { getSiteConfigForTenant } from "@/lib/cms/config";
import {
  findDefaultSiteForTenant,
  findDomainsBySiteId,
} from "@/core/tenant/repositories";
import {
  pickEmailOrigin,
  resolveEmailIdentity,
  type EmailDomainHint,
  type EmailIdentity,
} from "@/lib/notifications/identity";

/**
 * Identidad del Espacio que origina el correo.
 * Carga site_config y domains de ESE tenant; no del Host del request.
 */
export async function resolveEmailIdentityForTenant(
  tenantId: string
): Promise<EmailIdentity> {
  const trimmed = tenantId.trim();
  const config = trimmed ? await getSiteConfigForTenant(trimmed) : null;

  let siteId = trimmed;
  let domains: EmailDomainHint[] = [];

  if (trimmed) {
    const db = await getDatabase();
    const site = await findDefaultSiteForTenant(db, trimmed);
    siteId = site?.siteId?.trim() || site?._id || trimmed;
    const rows = siteId ? await findDomainsBySiteId(db, siteId) : [];
    domains = rows.map((row) => ({
      host: row.host,
      tenantId: row.tenantId,
      siteId: row.siteId,
      isPrimary: row.isPrimary,
    }));
  }

  const origin = pickEmailOrigin({
    tenantId: trimmed,
    siteId,
    domains,
    website: config?.institution.website,
  });

  return resolveEmailIdentity({
    config,
    tenantId: trimmed,
    siteId,
    origin,
  });
}
