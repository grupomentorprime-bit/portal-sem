export type { BrandingResolverInput, ResolvedBrandingAssets } from "./types";
export { resolveBrandingAssets } from "./resolve";
export {
  PLATFORM_CREDITS,
  PLATFORM_DISPLAY_NAME,
  PLATFORM_SPACE_FALLBACK,
  brandingFromConfig,
  configuredAssetUrl,
  displayInstitutionName,
  displayInstitutionShortName,
  hasConfiguredAsset,
  rewriteLegacyPlatformProductName,
  seoDescriptionFromConfig,
  seoTitleFromConfig,
  trimText,
} from "./display";
export { buildBrandThemeStyle, type BrandThemeCssVars } from "./theme";
