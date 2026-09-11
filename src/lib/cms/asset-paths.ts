/**
 * Placeholders de plataforma (no son marca de un tenant).
 * Logos SEM / IPN viven como archivos estáticos referenciados por T001/S001.
 */
export const PLATFORM_ASSET_FALLBACKS = {
  hero: "/images/hero-institutional.svg",
  heroPremium: "/images/hero-premium-student.jpg",
} as const;

/** Rutas históricas SEM — solo para materializar T001, no como fallback de Site vacío. */
export const SEM_SITE_ASSET_PATHS = {
  logo: "/images/logo-sem-isotype.png",
  logoOnDark: "/images/logo-sem-isotype-white.png",
  favicon: "/images/logo-sem-favicon.png",
  logoLegacy: "/images/logo-sem.svg",
  secondaryLogo: "/images/logo-ipn.svg",
} as const;

/** @deprecated Usar branding del Site. Conservado por imports legacy. */
export const CMS_ASSET_PATHS = {
  hero: PLATFORM_ASSET_FALLBACKS.hero,
  logoSem: SEM_SITE_ASSET_PATHS.logo,
  logoIpn: SEM_SITE_ASSET_PATHS.secondaryLogo,
} as const;
