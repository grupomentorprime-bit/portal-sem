/**
 * @deprecated Usar PortalCTAPremium — ver docs/core/CORE-CTA-PREMIUM-v1.md
 */

import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";

interface AdmissionCTAProps {
  settings: PortalCTAPremiumSettings;
}

export function AdmissionCTA({ settings }: AdmissionCTAProps) {
  return (
    <PortalCTAPremium
      settings={{ ...settings, variant: "highlight", background: "primary" }}
    />
  );
}
