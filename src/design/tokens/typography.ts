/**
 * Design Tokens — Tipografía oficial (DOC-002)
 */
export const fontFamilies = {
  brand: "Mosk, var(--font-manrope), system-ui, sans-serif",
  sans: "var(--font-manrope), system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

/** Escala fluida oficial */
export const typeScale = {
  displayXl: {
    cssVar: "--font-display-xl",
    size: "clamp(2.5rem, 5vw, 4rem)",
    lineHeight: "1.08",
    weight: "700",
    letterSpacing: "-0.025em",
  },
  display: {
    cssVar: "--font-display",
    size: "clamp(2rem, 4vw, 3rem)",
    lineHeight: "1.12",
    weight: "700",
    letterSpacing: "-0.025em",
  },
  heading: {
    cssVar: "--font-heading",
    size: "clamp(1.5rem, 2.5vw, 2.25rem)",
    lineHeight: "1.2",
    weight: "600",
    letterSpacing: "-0.02em",
  },
  title: {
    cssVar: "--font-title",
    size: "clamp(1.25rem, 2vw, 1.5rem)",
    lineHeight: "1.3",
    weight: "600",
    letterSpacing: "0",
  },
  subtitle: {
    cssVar: "--font-subtitle",
    size: "clamp(1.0625rem, 1.5vw, 1.25rem)",
    lineHeight: "1.4",
    weight: "500",
    letterSpacing: "0",
  },
  body: {
    cssVar: "--font-body",
    size: "1rem",
    lineHeight: "1.625",
    weight: "400",
    letterSpacing: "0",
  },
  caption: {
    cssVar: "--font-caption",
    size: "0.875rem",
    lineHeight: "1.5",
    weight: "400",
    letterSpacing: "0",
  },
  overline: {
    cssVar: "--font-overline",
    size: "0.75rem",
    lineHeight: "1.4",
    weight: "600",
    letterSpacing: "0.1em",
  },
  label: {
    cssVar: "--font-label",
    size: "0.8125rem",
    lineHeight: "1.35",
    weight: "500",
    letterSpacing: "0.02em",
  },
} as const;

/** @deprecated — usar typeScale */
export const fontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeights = {
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
} as const;

export const letterSpacing = {
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;

export type TypeScaleToken = keyof typeof typeScale;
