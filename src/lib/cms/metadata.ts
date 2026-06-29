import type { Metadata } from "next";
import { resolveSiteMetadata } from "@/core/seo";
import { getSiteConfig } from "@/lib/cms/config";
import type { SiteConfig } from "@/types/cms";

export async function buildSiteMetadata(config: SiteConfig | null): Promise<Metadata> {
  return resolveSiteMetadata(config);
}

export async function getSiteMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
