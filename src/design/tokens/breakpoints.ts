/**
 * Design Tokens — Breakpoints oficiales (DOC-002 / DOC-001)
 * Lista canónica AprendeHoy. Importar desde este archivo; no valores arbitrarios.
 */
export const breakpoints = {
  /** 360px — mobile compact */
  bp360: 360,
  /** 390px — mobile standard */
  bp390: 390,
  /** 414px — mobile large */
  bp414: 414,
  /** 480px — mobile landscape */
  bp480: 480,
  /** 640px — tablet portrait */
  bp640: 640,
  /** 768px — tablet */
  bp768: 768,
  /** 820px — tablet landscape */
  bp820: 820,
  /** 912px — small notebook */
  bp912: 912,
  /** 1024px — notebook */
  bp1024: 1024,
  /** 1200px — desktop */
  bp1200: 1200,
  /** 1366px — desktop HD */
  bp1366: 1366,
  /** 1440px — desktop wide */
  bp1440: 1440,
  /** 1536px — desktop XL */
  bp1536: 1536,
  /** 1600px — ultra wide entry */
  bp1600: 1600,
  /** 1920px — full HD */
  bp1920: 1920,
  /** 2560px — QHD / ultrawide */
  bp2560: 2560,
} as const;

/** Valores en px para media queries */
export const breakpointValues = { ...breakpoints } as const;

/** Strings con unidad para CSS-in-JS */
export const breakpointPx = Object.fromEntries(
  Object.entries(breakpoints).map(([key, value]) => [key, `${value}px`])
) as Record<keyof typeof breakpoints, string>;

/**
 * Alias Tailwind-compat (derivados de la escala oficial)
 * @deprecated Preferir claves bp* explícitas en código nuevo
 */
export const breakpointAliases = {
  sm: breakpoints.bp640,
  md: breakpoints.bp768,
  lg: breakpoints.bp1024,
  xl: 1280,
  "2xl": breakpoints.bp1536,
} as const;

export type BreakpointToken = keyof typeof breakpoints;
export type BreakpointAlias = keyof typeof breakpointAliases;

/** min-width media query helper */
export function minWidth(bp: number): string {
  return `(min-width: ${bp}px)`;
}

/** max-width media query helper */
export function maxWidth(bp: number): string {
  return `(max-width: ${bp - 1}px)`;
}
