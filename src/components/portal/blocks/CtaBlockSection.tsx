import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import { blockSettings } from "@/lib/portal/blocks";
import { asString } from "@/lib/cms/block-utils";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";
import type { PageBlock } from "@/types/page";

interface CtaBlockSectionProps {
  block: PageBlock;
  navigation: {
    quickLinks: Array<{ label: string; href: string; highlighted?: boolean }>;
  };
}

/** @deprecated Usar CtaPremiumBlockSection / bloque cta_premium */
export function CtaBlockSection({ block, navigation }: CtaBlockSectionProps) {
  const settings = blockSettings<PortalCTAPremiumSettings>(block);
  const applyQuickLink =
    navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];

  const title = asString(settings.title);
  const primaryLabel = asString(settings.primaryLabel, applyQuickLink?.label);
  const primaryHref = asString(settings.primaryHref, applyQuickLink?.href);

  if (!title && !primaryLabel) return null;

  const legacySettings: PortalCTAPremiumSettings = {
    ...settings,
    title,
    primaryLabel,
    primaryHref,
    secondaryLabel: asString(settings.secondaryLabel) || undefined,
    secondaryHref: asString(settings.secondaryHref) || undefined,
    variant:
      settings.variant === "default"
        ? "minimal"
        : settings.variant === "primary" || !settings.variant
          ? "highlight"
          : settings.variant,
    background: "primary",
  };

  return (
    <PortalSection id="cta-final">
      <PortalContainer>
        <PortalCTAPremium settings={legacySettings} />
      </PortalContainer>
    </PortalSection>
  );
}
