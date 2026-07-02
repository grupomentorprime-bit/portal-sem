/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalCTAPremium
 *
 * @see docs/core/CORE-CTA-PREMIUM-v1.md
 */

import {
  PortalCTAPremium,
  normalizeCtaPremiumSettings,
} from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface PortalCTAProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "primary";
}

export function PortalCTA({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "primary",
}: PortalCTAProps) {
  const settings: PortalCTAPremiumSettings = {
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
    variant: variant === "default" ? "minimal" : "highlight",
    background: variant === "primary" ? "primary" : "default",
  };

  const normalized = normalizeCtaPremiumSettings(settings);
  if (!normalized.title && normalized.buttons.length === 0) return null;

  return <PortalCTAPremium settings={settings} />;
}
