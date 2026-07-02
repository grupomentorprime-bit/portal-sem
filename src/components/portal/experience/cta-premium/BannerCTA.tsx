/**
 * @deprecated Usar PortalCTAPremium — ver docs/core/CORE-CTA-PREMIUM-v1.md
 */

import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface BannerCTAProps {
  settings: PortalCTAPremiumSettings;
}

export function BannerCTA({ settings }: BannerCTAProps) {
  return <PortalCTAPremium settings={{ ...settings, variant: "banner" }} />;
}
