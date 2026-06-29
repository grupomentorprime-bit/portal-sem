import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import type { BrandingResolverInput, ResolvedBrandingAssets } from "./types";

export function resolveBrandingAssets({ config }: BrandingResolverInput): ResolvedBrandingAssets {
  const { branding } = config;

  return {
    logo: branding.logo || PLATFORM_ASSET_FALLBACKS.logo,
    secondaryLogo: branding.secondaryLogo || undefined,
    hero: branding.heroImage || PLATFORM_ASSET_FALLBACKS.hero,
    favicon: branding.favicon || undefined,
    colors: {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      backgroundColor: branding.backgroundColor,
      textColor: branding.textColor,
    },
  };
}
