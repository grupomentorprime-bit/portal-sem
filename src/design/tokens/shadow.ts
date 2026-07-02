/**
 * Design Tokens — Sombras oficiales (DOC-002)
 */
export const shadow = {
  xs: "0 1px 2px 0 rgba(0, 42, 71, 0.03)",
  sm: "0 1px 2px 0 rgba(0, 42, 71, 0.04)",
  md: "0 2px 8px 0 rgba(0, 42, 71, 0.06)",
  lg: "0 4px 16px 0 rgba(0, 42, 71, 0.08)",
  xl: "0 8px 24px 0 rgba(0, 42, 71, 0.1)",
  none: "none",
} as const;

export const shadowCssVars = {
  xs: "--shadow-xs",
  sm: "--shadow-sm",
  md: "--shadow-md",
  lg: "--shadow-lg",
  xl: "--shadow-xl",
} as const;

export type ShadowToken = keyof typeof shadow;
