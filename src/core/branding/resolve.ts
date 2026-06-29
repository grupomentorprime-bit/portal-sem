import { resolveBrandingMediaUrls } from "@/core/media";
import type { BrandingResolverInput, ResolvedBrandingAssets } from "./types";

export async function resolveBrandingAssets({
  config,
}: BrandingResolverInput): Promise<ResolvedBrandingAssets> {
  const { branding } = config;
  const tenant = config.institution.tenant;

  const urls = tenant
    ? await resolveBrandingMediaUrls(tenant, branding)
    : {
        logo: branding.logo,
        secondaryLogo: branding.secondaryLogo,
        hero: branding.heroImage,
        favicon: branding.favicon,
      };

  return {
    logo: urls.logo,
    secondaryLogo: urls.secondaryLogo,
    hero: urls.hero,
    favicon: urls.favicon,
    colors: {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      backgroundColor: branding.backgroundColor,
      textColor: branding.textColor,
    },
  };
}
