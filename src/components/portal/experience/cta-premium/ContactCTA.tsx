/**
 * @deprecated Usar PortalCTAPremium — ver docs/core/CORE-CTA-PREMIUM-v1.md
 */

import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface ContactCTAProps {
  settings: PortalCTAPremiumSettings;
}

export function ContactCTA({ settings }: ContactCTAProps) {
  return <PortalCTAPremium settings={{ ...settings, variant: "center" }} />;
}
