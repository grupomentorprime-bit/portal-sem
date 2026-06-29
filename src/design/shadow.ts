/** Sombras muy suaves — sin sombras pesadas */
export const shadow = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 42, 71, 0.04)",
  md: "0 2px 8px 0 rgba(0, 42, 71, 0.06)",
  lg: "0 4px 16px 0 rgba(0, 42, 71, 0.08)",
  xl: "0 8px 24px 0 rgba(0, 42, 71, 0.1)",
} as const;

export type ShadowToken = keyof typeof shadow;
