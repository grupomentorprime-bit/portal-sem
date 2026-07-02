/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalCTAPremium
 *
 * @see docs/core/CORE-CTA-PREMIUM-v1.md
 */

import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface CTASectionProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "primary";
}

export function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "default",
}: CTASectionProps) {
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

  return (
    <PortalSection padding="lg" className={variant === "primary" ? "bg-primary" : "bg-background-soft"}>
      <PortalContainer size="md">
        <PortalCTAPremium settings={settings} />
      </PortalContainer>
    </PortalSection>
  );
}
