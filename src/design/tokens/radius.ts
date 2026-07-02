/**
 * Design Tokens — Border radius oficial (DOC-002)
 */
export const radius = {
  2: "2px",
  4: "4px",
  6: "6px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  pill: "9999px",
} as const;

/** Alias semánticos (mapean a escala numérica) */
export const radiusAlias = {
  sm: radius[4],
  md: radius[8],
  lg: radius[12],
  xl: radius[16],
  "2xl": radius[24],
  full: radius.pill,
} as const;

export const radiusCssVars = {
  2: "--radius-2",
  4: "--radius-4",
  6: "--radius-6",
  8: "--radius-8",
  12: "--radius-12",
  16: "--radius-16",
  20: "--radius-20",
  24: "--radius-24",
  pill: "--radius-pill",
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  xl: "--radius-xl",
  "2xl": "--radius-2xl",
  full: "--radius-full",
} as const;

export type RadiusToken = keyof typeof radius;
export type RadiusAliasToken = keyof typeof radiusAlias;
