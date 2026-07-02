/**
 * Design Tokens — Z-Index oficial (DOC-002)
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 400,
  modal: 500,
  toast: 800,
  tooltip: 900,
} as const;

/** @deprecated — fixed/popover niveles legacy */
export const zIndexLegacy = {
  fixed: 300,
  popover: 600,
} as const;

export const zIndexCssVars = {
  base: "--z-base",
  dropdown: "--z-dropdown",
  sticky: "--z-sticky",
  overlay: "--z-overlay",
  modal: "--z-modal",
  toast: "--z-toast",
  tooltip: "--z-tooltip",
} as const;

export type ZIndexToken = keyof typeof zIndex;
