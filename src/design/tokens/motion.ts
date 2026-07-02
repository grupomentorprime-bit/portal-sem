/**
 * Design Tokens — Motion oficial (DOC-002)
 */
export const motion = {
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
    hero: "600ms",
    carousel: "500ms",
    modal: "300ms",
    hover: "150ms",
    focus: "100ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    hero: "cubic-bezier(0.22, 1, 0.36, 1)",
    carousel: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export const motionCssVars = {
  fast: "--motion-fast",
  normal: "--motion-normal",
  slow: "--motion-slow",
  hero: "--motion-hero",
  carousel: "--motion-carousel",
  modal: "--motion-modal",
  hover: "--motion-hover",
  focus: "--motion-focus",
  easeDefault: "--ease-default",
  easeIn: "--ease-in",
  easeOut: "--ease-out",
  easeHero: "--ease-hero",
  easeCarousel: "--ease-carousel",
} as const;

/** @deprecated — usar motion.duration */
export const durations = motion.duration;

/** @deprecated — usar motion.easing */
export const easings = {
  default: motion.easing.default,
  in: motion.easing.in,
  out: motion.easing.out,
  inOut: motion.easing.inOut,
} as const;

export const animations = {
  fade: {
    in: "fade-in var(--motion-normal) var(--ease-default) forwards",
    out: "fade-out var(--motion-normal) var(--ease-default) forwards",
  },
  slide: {
    up: "slide-up var(--motion-normal) var(--ease-out) forwards",
    down: "slide-down var(--motion-normal) var(--ease-out) forwards",
    left: "slide-left var(--motion-normal) var(--ease-out) forwards",
    right: "slide-right var(--motion-normal) var(--ease-out) forwards",
  },
  zoom: {
    in: "zoom-in var(--motion-normal) var(--ease-out) forwards",
    out: "zoom-out var(--motion-normal) var(--ease-out) forwards",
  },
  hover: "transform var(--motion-hover) var(--ease-default)",
  press: "transform var(--motion-fast) var(--ease-in)",
} as const;

export type MotionDurationToken = keyof typeof motion.duration;
export type DurationToken = MotionDurationToken;
