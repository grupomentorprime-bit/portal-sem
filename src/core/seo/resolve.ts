import type { Metadata } from "next";
import type { SiteConfig } from "@/types/cms";

export function resolvePageTitle(pageName: string, config: SiteConfig): string {
  const suffix = config.institution.shortName || config.institution.name;
  return suffix ? `${pageName} | ${suffix}` : pageName;
}

export function resolveSiteMetadata(config: SiteConfig | null): Metadata {
  if (!config) {
    return {
      title: "Portal Institucional",
      description: "Portal institucional",
    };
  }

  const { institution, seo, branding } = config;
  const title = seo.title || institution.name;
  const description = seo.description;

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
      images: branding.heroImage
        ? [{ url: branding.heroImage, alt: institution.name }]
        : branding.logo
          ? [{ url: branding.logo, alt: institution.name }]
          : undefined,
      locale: "es_CL",
      type: "website",
    },
    icons: branding.favicon ? { icon: branding.favicon } : undefined,
  };
}
