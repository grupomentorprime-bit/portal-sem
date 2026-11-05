import { isSemTenant } from "@/core/tenant/is-sem";

/**
 * Marca de pestaña cuando el Espacio todavía no subió la suya.
 * No es el isotipo de SEM.
 */
export const PLATFORM_FAVICON_PATH = "/images/platform/mark.png";

const SEM_OWNED_ASSET_RE = /logo-sem|logo-ipn|seminarioipn/i;

/** Archivos estáticos que pertenecen a T001, no a la plataforma ni a otro Espacio. */
export function isSemOwnedAsset(url: string | null | undefined): boolean {
  const value = url?.trim() ?? "";
  if (!value) return false;
  return SEM_OWNED_ASSET_RE.test(value);
}

/**
 * Conserva la URL si es del Espacio.
 * En cualquier otro Espacio, una ruta de SEM cuenta como “todavía no hay logo”.
 */
export function assetForTenant(
  tenantId: string | null | undefined,
  url: string | null | undefined
): string {
  const value = url?.trim() ?? "";
  if (!value) return "";
  if (!isSemTenant(tenantId) && isSemOwnedAsset(value)) return "";
  return value;
}

/** Favicon público: el del Espacio, o la marca genérica de plataforma. */
export function faviconForTenant(
  tenantId: string | null | undefined,
  url: string | null | undefined
): string {
  return assetForTenant(tenantId, url) || PLATFORM_FAVICON_PATH;
}

export function brandingWithoutForeignSemAssets<
  T extends {
    logo?: string;
    secondaryLogo?: string;
    favicon?: string;
    heroImage?: string;
  },
>(tenantId: string, branding: T): T {
  if (isSemTenant(tenantId)) return branding;
  return {
    ...branding,
    logo: assetForTenant(tenantId, branding.logo),
    secondaryLogo: assetForTenant(tenantId, branding.secondaryLogo),
    favicon: assetForTenant(tenantId, branding.favicon),
    heroImage: assetForTenant(tenantId, branding.heroImage),
  };
}
