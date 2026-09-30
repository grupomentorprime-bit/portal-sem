import { getTenantContext } from "@/core/tenant";
import { resolveSiteMetadata } from "@/core/seo";
import { getSiteConfig } from "@/lib/cms/config";
import { ensureProductionCodedSites } from "@/sites/production";
import { getCodedSite } from "@/sites/registry";
import { resolveCumpleSeo } from "@/sites/cumple/seo";
import { CUMPLE_TENANT_ID } from "@/sites/cumple/site";
import type { SiteConfig } from "@/types/cms";
import type { Metadata } from "next";
import { headers } from "next/headers";

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
      const headerList = await headers();
      const pathname = headerList.get("x-pathname") ?? "/";
      const seo = resolveCumpleSeo(pathname);
      return {
        ...meta,
        title: seo.title,
        description: seo.description,
        openGraph: {
          ...meta.openGraph,
          title: seo.title,
          description: seo.description,
        },
      };
    }
    return meta;
  }
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
