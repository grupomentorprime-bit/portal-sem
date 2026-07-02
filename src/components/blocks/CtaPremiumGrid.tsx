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

interface CtaPremiumGridProps {
  settings: Record<string, unknown>;
}

export function CtaPremiumGrid({ settings }: CtaPremiumGridProps) {
  return (
    <PortalSection id="cta-premium">
      <PortalContainer>
        <PortalCTAPremium settings={settings as PortalCTAPremiumSettings} />
      </PortalContainer>
    </PortalSection>
  );
}
