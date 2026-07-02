/**
 * Design Tokens — Colores semánticos oficiales (DOC-002 / OT-BRANDING-002)
 * Fuente CSS canónica: src/styles/tokens/brand.css + colors.css
 * Sin nombres de institución. Valores por defecto de plataforma;
 * en runtime los sobreescribe el Branding CMS vía --brand-* → --color-*.
 */
export const colorDefaults = {
  primary: "#002A47",
  secondary: "#246AA1",
  accent: "#10BCE2",
  success: "#3ED6AF",
  warning: "#8CE27F",
  danger: "#B42318",
  info: "#10BCE2",
  surface: "#FFFFFF",
  background: "#FFFFFF",
  foreground: "#141F29",
  border: "#D1D9E0",
  muted: "#5C7289",
} as const;

/** Escala neutra (no semántica de marca) */
export const neutralScale = {
  50: "#F5F7F9",
  100: "#E8ECF0",
  200: "#D1D9E0",
  300: "#A8B5C2",
  400: "#7A8FA3",
  500: "#5C7289",
  600: "#475A6E",
  700: "#354656",
  800: "#243340",
  900: "#141F29",
} as const;

/** @deprecated Use colorDefaults — alias retrocompatibilidad */
export const colors = {
  primary: colorDefaults.primary,
  secondary: colorDefaults.secondary,
  accent: colorDefaults.accent,
  success: colorDefaults.success,
  light: colorDefaults.warning,
  white: colorDefaults.surface,
  gray: neutralScale,
} as const;

export const semanticColors = {
  info: colorDefaults.info,
  warning: colorDefaults.warning,
  error: colorDefaults.danger,
  neutral: neutralScale[500],
} as const;

/** Nombres de variables CSS canónicas */
export const colorCssVars = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  accent: "--color-accent",
  success: "--color-success",
  warning: "--color-warning",
  danger: "--color-danger",
  info: "--color-info",
  surface: "--color-surface",
  background: "--color-background",
  foreground: "--color-foreground",
  border: "--color-border",
  muted: "--color-muted",
} as const;

/** Variables inyectadas por Branding CMS (layout.tsx) — no consumir en componentes */
export const brandingCssVars = {
  primary: "--brand-primary",
  secondary: "--brand-secondary",
  background: "--brand-background",
  text: "--brand-text",
} as const;

export type ColorToken = keyof typeof colorDefaults;
export type NeutralScaleKey = keyof typeof neutralScale;
