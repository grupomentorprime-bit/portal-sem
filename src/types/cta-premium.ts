/** Experience Module — CTA Premium v1.0 (LOCKED) */

import type { ExperienceAction } from "@/types/experience-action";

export const CTA_PREMIUM_VARIANTS = [
  "center",
  "split",
  "banner",
  "minimal",
  "highlight",
] as const;

export type CtaPremiumVariant = (typeof CTA_PREMIUM_VARIANTS)[number];

export const CTA_PREMIUM_BACKGROUNDS = [
  "default",
  "primary",
  "secondary",
  "surface",
  "muted",
] as const;

export type CtaPremiumBackground = (typeof CTA_PREMIUM_BACKGROUNDS)[number];

export const CTA_BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
] as const;

export type CtaButtonVariant = (typeof CTA_BUTTON_VARIANTS)[number];

export interface PortalCtaButton {
  id?: string;
  label: string;
  action: ExperienceAction;
  variant?: CtaButtonVariant;
  icon?: string;
  visible?: boolean;
  /** @deprecated Usar action.type === "url" */
  href?: string;
  /** @deprecated Usar action.newTab */
  newTab?: boolean;
}

export interface PortalCtaStat {
  id?: string;
  value: string;
  label: string;
  visible?: boolean;
}

export interface PortalCTAPremiumSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  variant?: CtaPremiumVariant | string;
  background?: CtaPremiumBackground | string;
  image?: string;
  imageAlt?: string;
  showStats?: boolean;
  stats?: PortalCtaStat[];
  buttons?: PortalCtaButton[];
  /** @deprecated Usar buttons[] */
  primaryLabel?: string;
  /** @deprecated Usar buttons[] */
  primaryHref?: string;
  /** @deprecated Usar buttons[] */
  secondaryLabel?: string;
  /** @deprecated Usar buttons[] */
  secondaryHref?: string;
}

export interface PortalCTAPremiumProps {
  settings: PortalCTAPremiumSettings;
  id?: string;
  className?: string;
}

export interface PortalCTAContentProps {
  overline?: string;
  title: string;
  description?: string;
  inverse?: boolean;
  centered?: boolean;
  titleId?: string;
  className?: string;
}

export interface PortalCTAButtonsProps {
  buttons: PortalCtaButton[];
  inverse?: boolean;
  className?: string;
}

export interface PortalCTAStatsProps {
  stats: PortalCtaStat[];
  inverse?: boolean;
  className?: string;
}

export interface PortalCTAImageProps {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
}
