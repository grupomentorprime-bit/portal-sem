/**
 * Design Tokens — Colores semánticos oficiales (DOC-002 / OT-BRANDING-002)
 * Fuente CSS canónica: src/styles/tokens/brand.css + colors.css
 * Sin nombres de institución. Valores por defecto de plataforma (Growth OS);
 * en runtime los sobreescribe el Branding CMS vía --brand-* → --color-*.
 */
export const colorDefaults = {
  primary: "#0E4F90",
  secondary: "#6C99CD",
  accent: "#7C5CFA",
  success: "#18B981",
  warning: "#F59B45",
  danger: "#B42318",
  info: "#6C99CD",
  surface: "#FFFFFF",
  background: "#F4F7FB",
  foreground: "#0B1F3A",
  border: "#D9E4F2",
  muted: "#6C87AC",
} as const;

/** Escala neutra Growth OS (no semántica de marca) */
export const neutralScale = {
  50: "#F4F7FB",
  100: "#EAF2FC",
  200: "#D9E4F2",
  300: "#B8C9DE",
  400: "#8FA8C4",
  500: "#6C87AC",
  600: "#557194",
  700: "#3A5273",
  800: "#1E3355",
  900: "#0B1F3A",
} as const;

/**
 * Pack de identidad SEM (dato T001/S001) — no es default de plataforma.
 * site_config lo materializa; /admin lo consume vía --brand-*.
 */
export const semSiteBrandColors = {
  primary: "#002A47",
  secondary: "#246AA1",
  accent: "#10BCE2",
  success: "#3ED6AF",
  light: "#8CE27F",
  surface: "#FFFFFF",
  foreground: "#141F29",
} as const;

/** Pack bootstrap ADL (dato T002) — combinación distinta de SEM */
export const adlSiteBrandColors = {
  primary: "#18B981",
  secondary: "#B42318",
  surface: "#FFFFFF",
  foreground: "#0B1F3A",
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
