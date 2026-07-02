/**
 * Design Tokens — Espaciado oficial (DOC-002)
 * Escala: 0 · XS · SM · MD · LG · XL · 2XL · 3XL · 4XL
 */
export const spacing = {
  0: "0",
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const;

export const spacingCssVars = {
  0: "--space-0",
  xs: "--space-xs",
  sm: "--space-sm",
  md: "--space-md",
  lg: "--space-lg",
  xl: "--space-xl",
  "2xl": "--space-2xl",
  "3xl": "--space-3xl",
  "4xl": "--space-4xl",
} as const;

/** @deprecated — claves numéricas legacy (8pt) */
export const spacingLegacy = {
  1: spacing.xs,
  2: spacing.sm,
  4: spacing.md,
  6: spacing.lg,
  8: spacing.xl,
  12: spacing["2xl"],
  16: spacing["3xl"],
  24: spacing["4xl"],
  32: "128px",
} as const;

export type SpacingToken = keyof typeof spacing;
