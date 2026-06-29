/** Tipografía institucional — Mosk (objetivo), Manrope (fallback actual) */
export const fontFamilies = {
  /** Fuente institucional definitiva (pendiente de licencia/archivos) */
  brand: "Mosk, var(--font-manrope), system-ui, sans-serif",
  /** Reemplazo temporal aprobado */
  sans: "var(--font-manrope), system-ui, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

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

/** Jerarquía tipográfica institucional — solo estos tamaños */
export const typeScale = {
  /** Hero principal */
  displayXxl: {
    size: "clamp(2.5rem, 5vw, 4rem)",
    lineHeight: "1.1",
    weight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  /** Portadas */
  displayXl: {
    size: "clamp(2rem, 4vw, 3rem)",
    lineHeight: "1.15",
    weight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  /** Secciones */
  displayL: {
    size: "clamp(1.75rem, 3vw, 2.25rem)",
    lineHeight: "1.2",
    weight: fontWeights.semibold,
    letterSpacing: letterSpacing.tight,
  },
  /** Bloques */
  heading: {
    size: "1.5rem",
    lineHeight: "1.3",
    weight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  /** Texto base */
  body: {
    size: "1rem",
    lineHeight: "1.625",
    weight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Información secundaria */
  caption: {
    size: "0.875rem",
    lineHeight: "1.5",
    weight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type TypeScaleToken = keyof typeof typeScale;

