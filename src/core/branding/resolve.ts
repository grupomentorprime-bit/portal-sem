import { resolveBrandingMediaUrls } from "@/core/media";
import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import { assetForTenant } from "./foreign-assets";
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

  const logo = assetForTenant(tenant, urls.logo);
  const secondaryLogo = assetForTenant(tenant, urls.secondaryLogo);
  const hero = assetForTenant(tenant, urls.hero) || PLATFORM_ASSET_FALLBACKS.hero;
  const favicon = assetForTenant(tenant, urls.favicon);

  return {
    logo,
    secondaryLogo: secondaryLogo || undefined,
    hero,
    favicon: favicon || undefined,
    colors: {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      backgroundColor: branding.backgroundColor,
      textColor: branding.textColor,
    },
  };
}
