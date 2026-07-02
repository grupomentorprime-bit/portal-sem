/**
 * @deprecated Usar PortalCTAPremium — ver docs/core/CORE-CTA-PREMIUM-v1.md
 */

import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface HeroBottomCTAProps {
  settings: PortalCTAPremiumSettings;
}

export function HeroBottomCTA({ settings }: HeroBottomCTAProps) {
  return <PortalCTAPremium settings={{ ...settings, variant: "minimal" }} />;
}
