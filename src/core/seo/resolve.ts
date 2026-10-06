import type { Metadata } from "next";
import { resolveSeoImageUrls } from "@/core/media";
import { assetForTenant, faviconForTenant } from "@/core/branding/foreign-assets";
import {
  PLATFORM_DISPLAY_NAME,
  seoDescriptionFromConfig,
  seoTitleFromConfig,
} from "@/core/branding";
import type { SiteConfig } from "@/types/cms";

export function resolvePageTitle(pageName: string, config: SiteConfig): string {
  const suffix = config.institution.shortName || config.institution.name;
  return suffix ? `${pageName} | ${suffix}` : pageName;
}

export async function resolveSiteMetadata(config: SiteConfig | null): Promise<Metadata> {
  if (!config) {
    const icon = faviconForTenant(null, "");
    return {
      title: PLATFORM_DISPLAY_NAME,
      description: "Portal institucional",
      icons: { icon, apple: icon },
    };
  }

  const { institution, seo, branding } = config;
  const title = seoTitleFromConfig(config);
  const description = seoDescriptionFromConfig(config);
  const tenant = institution.tenant;

  const resolvedImages = tenant
    ? await resolveSeoImageUrls(tenant, seo, branding)
    : {
        ogImage: seo.ogImage ?? branding.heroImage ?? branding.logo,
        twitterImage: undefined as string | undefined,
      };
  const ogImage = assetForTenant(tenant, resolvedImages.ogImage) || undefined;
  const twitterImage =
    assetForTenant(tenant, resolvedImages.twitterImage) || ogImage;

  const favicon =
    tenant && branding.faviconMediaId
      ? (await import("@/core/media")).resolveMediaRef(tenant, {
          mediaId: branding.faviconMediaId,
          legacyUrl: branding.favicon,
        })
      : Promise.resolve(branding.favicon || undefined);

  const faviconUrl = faviconForTenant(tenant, (await favicon) || branding.favicon);

  return {
    title,
    description,
    keywords: seo.keywords,
    robots: {
      index: institution.status === "active",
      follow: institution.status === "active",
    },
    openGraph: {
      title,
      description,
      siteName: institution.name || PLATFORM_DISPLAY_NAME,
      images: ogImage
        ? [{ url: ogImage, alt: institution.name || PLATFORM_DISPLAY_NAME }]
        : undefined,
      locale: "es_CL",
      type: "website",
    },
    twitter: twitterImage
      ? { card: "summary_large_image", images: [twitterImage] }
      : undefined,
    icons: { icon: faviconUrl, apple: faviconUrl },
  };
}
