import { getTenantContext } from "@/core/tenant";
import { resolveSiteMetadata } from "@/core/seo";
import { getSiteConfig } from "@/lib/cms/config";
import { ensureProductionCodedSites } from "@/sites/production";
import { getCodedSite } from "@/sites/registry";
import { CUMPLE_SEO, CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import type { SiteConfig } from "@/types/cms";
import type { Metadata } from "next";

export async function buildSiteMetadata(config: SiteConfig | null): Promise<Metadata> {
  return resolveSiteMetadata(config);
}

export async function getSiteMetadata(): Promise<Metadata> {
  const ctx = await getTenantContext();
  if (ctx) {
    const meta = await buildSiteMetadata(ctx.config);
    ensureProductionCodedSites();
    const site = getCodedSite(ctx.tenantId);
    if (site && ctx.tenantId === CUMPLE_TENANT_ID) {
      return {
        ...meta,
        title: CUMPLE_SEO.title,
        description: CUMPLE_SEO.description,
        openGraph: {
          ...meta.openGraph,
          title: CUMPLE_SEO.title,
          description: CUMPLE_SEO.description,
        },
      };
    }
    return meta;
  }
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
