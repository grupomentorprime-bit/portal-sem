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
    if (site) {
      const headerList = await headers();
      const pathname = headerList.get("x-pathname") ?? "/";
      if (ctx.tenantId === CUMPLE_TENANT_ID) {
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
      const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
      const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path || "/";
      const page = site.pages.find((item) => item.path === normalized);
      if (page) {
        const description =
          page.description ??
          (typeof meta.description === "string" ? meta.description : undefined);
        return {
          ...meta,
          title: page.title,
          description,
          openGraph: {
            ...meta.openGraph,
            title: page.title,
            description,
          },
        };
      }
    }
    return meta;
  }
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
