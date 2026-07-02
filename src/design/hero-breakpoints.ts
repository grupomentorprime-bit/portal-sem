/**
 * Breakpoints del Hero Premium (OT-BUG-HERO-009 / OT-BUG-HERO-010).
 * Referencia JS; el CSS en hero-premium.css usa los mismos umbrales.
 */
export const heroBreakpoints = {
  mobileMax: 767,
  tablet: 768,
  tabletMax: 1199,
  notebook: 1200,
  notebookMax: 1599,
  desktop: 1600,
  desktopXl: 1600,
} as const;

export type HeroBreakpointKey = keyof typeof heroBreakpoints;

/** Umbral imagen mobile vs desktop (solo una variante en DOM). */
export const HERO_MOBILE_IMAGE_MAX_WIDTH = heroBreakpoints.mobileMax;
