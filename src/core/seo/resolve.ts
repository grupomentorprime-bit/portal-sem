import type { Metadata } from "next";
import { resolveSeoImageUrls } from "@/core/media";
import type { SiteConfig } from "@/types/cms";

export function resolvePageTitle(pageName: string, config: SiteConfig): string {
  const suffix = config.institution.shortName || config.institution.name;
  return suffix ? `${pageName} | ${suffix}` : pageName;
}

export async function resolveSiteMetadata(config: SiteConfig | null): Promise<Metadata> {
  if (!config) {
    return {
      title: "Portal Institucional",
      description: "Portal institucional",
    };
  }

  const { institution, seo, branding } = config;
  const title = seo.title || institution.name;
  const description = seo.description;
  const tenant = institution.tenant;

  const images = tenant
    ? await resolveSeoImageUrls(tenant, seo, branding)
    : { ogImage: seo.ogImage ?? branding.heroImage ?? branding.logo };

  const favicon =
    tenant && branding.faviconMediaId
      ? (await import("@/core/media")).resolveMediaRef(tenant, {
          mediaId: branding.faviconMediaId,
          legacyUrl: branding.favicon,
        })
      : Promise.resolve(branding.favicon || undefined);

  const faviconUrl = (await favicon) || undefined;

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
      siteName: institution.name,
      images: images.ogImage
        ? [{ url: images.ogImage, alt: institution.name }]
        : undefined,
      locale: "es_CL",
      type: "website",
    },
    twitter: images.twitterImage
      ? { card: "summary_large_image", images: [images.twitterImage] }
      : undefined,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
  };
}
