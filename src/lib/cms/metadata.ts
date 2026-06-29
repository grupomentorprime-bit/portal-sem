import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/cms/config";
import type { SiteConfig } from "@/types/cms";

export function buildSiteMetadata(config: SiteConfig | null): Metadata {
  if (!config) {
    return {
      title: "Portal Institucional",
      description: "Portal Institucional SEM",
    };
  }

  const { institution, seo, branding, social } = config;
  const title = seo.title || institution.name;
  const description = seo.description;
  const siteUrl = institution.website || undefined;

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
      url: siteUrl,
      siteName: institution.name,
      images: branding.heroImage
        ? [{ url: branding.heroImage, alt: institution.name }]
        : branding.logo
          ? [{ url: branding.logo, alt: institution.name }]
          : undefined,
      locale: "es_CL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: branding.heroImage ? [branding.heroImage] : undefined,
    },
    icons: branding.favicon ? { icon: branding.favicon } : undefined,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    alternates: siteUrl ? { canonical: siteUrl } : undefined,
    other: {
      "og:see_also": [
        social.facebook,
        social.instagram,
        social.youtube,
        social.linkedin,
        social.tiktok,
      ]
        .filter(Boolean)
        .join(","),
    },
  };
}

export async function getSiteMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return buildSiteMetadata(config);
}
