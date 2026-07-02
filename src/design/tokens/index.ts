/**
 * Design Tokens — Barrel oficial AprendeHoy (DOC-002)
 * @see docs/frontend/DOC-002-DESIGN-TOKENS.md
 */
export {
  colorDefaults,
  neutralScale,
  colors,
  semanticColors,
  colorCssVars,
  brandingCssVars,
  type ColorToken,
  type NeutralScaleKey,
} from "./colors";

export {
  fontFamilies,
  typeScale,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  type TypeScaleToken,
} from "./typography";

export { spacing, spacingCssVars, spacingLegacy, type SpacingToken } from "./spacing";

export {
  radius,
  radiusAlias,
  radiusCssVars,
  type RadiusToken,
  type RadiusAliasToken,
} from "./radius";

export { shadow, shadowCssVars, type ShadowToken } from "./shadow";

export {
  motion,
  motionCssVars,
  durations,
  easings,
  animations,
  type MotionDurationToken,
  type DurationToken,
} from "./motion";

export { zIndex, zIndexLegacy, zIndexCssVars, type ZIndexToken } from "./z-index";

export {
  breakpoints,
  breakpointValues,
  breakpointPx,
  breakpointAliases,
  minWidth,
  maxWidth,
  type BreakpointToken,
  type BreakpointAlias,
} from "./breakpoints";

/** Flujo Branding CMS → tokens semánticos (documentación) */
export const brandingTokenFlow = [
  "Branding CMS",
  "layout.tsx (--brand-*)",
  "design-tokens.css (--color-*)",
  "Componentes",
] as const;
