/**
 * OT-UX-FOUNDATION-001 — Breakpoints oficiales AprendeHoy
 * Fuente única para CSS (foundation/breakpoints.css) y TypeScript.
 */

export const foundationBreakpoints = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 991 },
  tabletXl: { min: 992, max: 1279 },
  laptop: { min: 1280, max: 1439 },
  desktop: { min: 1440, max: 1919 },
  desktopXl: { min: 1920, max: Infinity },
} as const;

export const foundationContainers = {
  xs: { maxWidth: "100%", padding: 16 },
  sm: { maxWidth: 720, padding: 24 },
  md: { maxWidth: 960, padding: 24 },
  lg: { maxWidth: 1180, padding: 32 },
  xl: { maxWidth: 1360, padding: 32 },
  xxl: { maxWidth: 1560, padding: 40 },
} as const;

export const foundationSpacing = [8, 16, 24, 32, 48, 64, 80, 120, 160] as const;

export const foundationMediaRatios = {
  hero: "21 / 9",
  program: "16 / 9",
  news: "16 / 9",
  teacher: "4 / 5",
  gallery: "1 / 1",
  cta: "4 / 3",
} as const;

export type FoundationTier = keyof typeof foundationBreakpoints;
export type FoundationContainer = keyof typeof foundationContainers;
