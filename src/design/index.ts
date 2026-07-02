/**
 * Design System — Tokens oficiales AprendeHoy (DOC-002)
 * @see docs/frontend/DOC-002-DESIGN-TOKENS.md
 */
export * from "./tokens";

export {
  foundationBreakpoints,
  foundationContainers,
  foundationSpacing,
  foundationMediaRatios,
  type FoundationTier,
  type FoundationContainer,
} from "./tokens/foundation-breakpoints";

export { iconSizes, type IconSizeToken } from "./icon-sizes";
export {
  heroBreakpoints,
  HERO_MOBILE_IMAGE_MAX_WIDTH,
  type HeroBreakpointKey,
} from "./hero-breakpoints";

/** @deprecated Use breakpointStrings from ./breakpoints */
export { breakpointStrings as legacyBreakpointStrings } from "./breakpoints";
