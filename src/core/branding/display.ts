import type { Branding, SiteConfig } from "@/types/cms";

/** Nombre de producto de plataforma — nunca una institución concreta. */
export const PLATFORM_DISPLAY_NAME = "Growth OS";

/**
 * Fallback visible cuando el Site/Espacio no tiene nombre configurado.
 * Nunca SEM ni un cliente concreto.
 */
export const PLATFORM_SPACE_FALLBACK = "tu Espacio";

/** Crédito de plataforma cuando el Site no define uno propio. */
export const PLATFORM_CREDITS = PLATFORM_DISPLAY_NAME;

/**
 * Reescribe nombres de producto heredados en copy de plataforma (créditos, fallbacks).
 * No usar sobre contenido T001 ni sobre copy del adapter Aprende Hoy.
 */
export function rewriteLegacyPlatformProductName(
  value: string | null | undefined
): string {
  let next = trimText(value);
  if (!next) return "";
  next = next.replace(/AprendeHoy Learning OS/gi, PLATFORM_DISPLAY_NAME);
  next = next.replace(/Learning OS/gi, PLATFORM_DISPLAY_NAME);
  next = next.replace(/Portal SEM/gi, PLATFORM_DISPLAY_NAME);
  return next;
}

export function trimText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function displayInstitutionName(
  name: string | null | undefined,
  fallback: string = PLATFORM_SPACE_FALLBACK
): string {
  return trimText(name) || fallback;
}

export function displayInstitutionShortName(
  shortName: string | null | undefined,
  name?: string | null
): string {
  return trimText(shortName) || trimText(name);
}

export function configuredAssetUrl(url: string | null | undefined): string {
  return trimText(url);
}

export function hasConfiguredAsset(url: string | null | undefined): boolean {
  return configuredAssetUrl(url).length > 0;
}

export function seoTitleFromConfig(config: SiteConfig | null | undefined): string {
  if (!config) return PLATFORM_DISPLAY_NAME;
  return (
    trimText(config.seo.title) ||
    trimText(config.institution.name) ||
    PLATFORM_DISPLAY_NAME
  );
}

export function seoDescriptionFromConfig(
  config: SiteConfig | null | undefined,
  fallback?: string
): string | undefined {
  const fromSeo = trimText(config?.seo.description);
  if (fromSeo) return fromSeo;
  const extra = trimText(fallback);
  return extra || undefined;
}

export function brandingFromConfig(config: SiteConfig | null | undefined): Branding | undefined {
  return config?.branding;
}
