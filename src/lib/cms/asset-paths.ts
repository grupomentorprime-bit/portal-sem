/** Fallbacks genéricos de plataforma — sin branding de tenant específico */
export const PLATFORM_ASSET_FALLBACKS = {
  hero: "/images/hero-institutional.svg",
  heroPremium: "/images/hero-premium-student.jpg",
  /** Isotipo oficial SEM — fondos claros (header) */
  logo: "/images/logo-sem-isotype.png",
  /** Isotipo blanco — fondos oscuros (footer, watermarks) */
  logoOnDark: "/images/logo-sem-isotype-white.png",
  logoLegacy: "/images/logo-sem.svg",
  secondaryLogo: "/images/logo-ipn.svg",
} as const;

/** @deprecated Use PLATFORM_ASSET_FALLBACKS */
export const CMS_ASSET_PATHS = {
  hero: PLATFORM_ASSET_FALLBACKS.hero,
  logoSem: PLATFORM_ASSET_FALLBACKS.logo,
  logoIpn: PLATFORM_ASSET_FALLBACKS.secondaryLogo,
} as const;
