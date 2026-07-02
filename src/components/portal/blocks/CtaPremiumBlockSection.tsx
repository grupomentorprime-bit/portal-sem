import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalCTAPremium } from "@/components/portal/experience/cta-premium";
import { normalizeCtaPremiumSettings } from "@/components/portal/experience/cta-premium/mappers";
import { blockSettings } from "@/lib/portal/blocks";
import { asString } from "@/lib/cms/block-utils";
import type { PortalCTAPremiumSettings } from "@/types/cta-premium";
import { mergeHomeCtaSettings } from "@/lib/portal/institutional-demo";
import type { PageBlock } from "@/types/page";

interface CtaPremiumBlockSectionProps {
  block: PageBlock;
  navigation: {
    quickLinks: Array<{ label: string; href: string; highlighted?: boolean }>;
  };
  pageSlug?: string;
}

export function CtaPremiumBlockSection({
  block,
  navigation,
  pageSlug,
}: CtaPremiumBlockSectionProps) {
  const settings = blockSettings<PortalCTAPremiumSettings>(block);
  const applyQuickLink =
    navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];

  const normalized = normalizeCtaPremiumSettings(settings);
  const merged: PortalCTAPremiumSettings = mergeHomeCtaSettings(
    {
      ...settings,
      title: normalized.title || asString(settings.title, "¿Listo para comenzar?"),
      buttons:
        normalized.buttons.length > 0
          ? normalized.buttons
          : applyQuickLink
            ? [
                {
                  id: "primary",
                  label: applyQuickLink.label,
                  action: { type: "url" as const, href: applyQuickLink.href },
                  variant: "primary" as const,
                  visible: true,
                },
              ]
            : [],
    },
    pageSlug
  );

  if (!merged.title && (!merged.buttons || merged.buttons.length === 0)) return null;

  return (
    <PortalSection id="cta-premium">
      <PortalContainer>
        <PortalCTAPremium settings={merged} />
      </PortalContainer>
    </PortalSection>
  );
}
