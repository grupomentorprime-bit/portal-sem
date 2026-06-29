export const durations = {
  fast: "150ms",
  normal: "250ms",
  slow: "350ms",
} as const;

export const easings = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const animations = {
  fade: {
    in: "fade-in var(--transition-normal) var(--ease-default) forwards",
    out: "fade-out var(--transition-normal) var(--ease-default) forwards",
  },
  slide: {
    up: "slide-up var(--transition-normal) var(--ease-out) forwards",
    down: "slide-down var(--transition-normal) var(--ease-out) forwards",
    left: "slide-left var(--transition-normal) var(--ease-out) forwards",
    right: "slide-right var(--transition-normal) var(--ease-out) forwards",
  },
  zoom: {
    in: "zoom-in var(--transition-normal) var(--ease-out) forwards",
    out: "zoom-out var(--transition-normal) var(--ease-out) forwards",
  },
  hover: "transform var(--transition-fast) var(--ease-default)",
  press: "transform var(--transition-fast) var(--ease-in)",
} as const;

export type DurationToken = keyof typeof durations;
