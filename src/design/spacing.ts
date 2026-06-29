/** Sistema de espaciado 8pt */
export const spacing = {
  1: "4px",
  2: "8px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
  32: "128px",
} as const;

export type SpacingToken = keyof typeof spacing;
