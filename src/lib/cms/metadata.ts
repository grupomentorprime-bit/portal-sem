import { getTenantContext } from "@/core/tenant";
import { resolveSiteMetadata } from "@/core/seo";
import { getSiteConfig } from "@/lib/cms/config";
import type { SiteConfig } from "@/types/cms";
import type { Metadata } from "next";

export async function buildSiteMetadata(config: SiteConfig | null): Promise<Metadata> {
  return resolveSiteMetadata(config);
}

export async function getSiteMetadata(): Promise<Metadata> {
  const ctx = await getTenantContext();
  if (ctx) return buildSiteMetadata(ctx.config);
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
