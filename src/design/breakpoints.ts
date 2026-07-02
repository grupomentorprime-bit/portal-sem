export {
  breakpoints,
  breakpointValues,
  breakpointPx,
  breakpointAliases,
  minWidth,
  maxWidth,
  type BreakpointToken,
  type BreakpointAlias,
} from "./tokens/breakpoints";

/** @deprecated Use breakpointPx — Tailwind-compat string map */
export const breakpointStrings = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
