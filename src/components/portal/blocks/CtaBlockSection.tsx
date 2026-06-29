import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalCTA } from "@/components/portal/layout/PortalCTA";
import { blockSettings } from "@/lib/portal/blocks";
import { asString } from "@/lib/cms/block-utils";
import type { PageBlock } from "@/types/page";

interface CtaBlockSectionProps {
  block: PageBlock;
  navigation: {
    quickLinks: Array<{ label: string; href: string; highlighted?: boolean }>;
  };
}

export function CtaBlockSection({ block, navigation }: CtaBlockSectionProps) {
  const settings = blockSettings<{
    title?: string;
    description?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    variant?: string;
  }>(block);

  const applyQuickLink =
    navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];

  const title = asString(settings.title);
  const primaryLabel = asString(settings.primaryLabel, applyQuickLink?.label);
  const primaryHref = asString(settings.primaryHref, applyQuickLink?.href);

  if (!title && !primaryLabel) return null;

  return (
    <PortalSection id="cta-final">
      <PortalContainer>
        <PortalCTA
          title={title}
          description={asString(settings.description) || undefined}
          primaryLabel={primaryLabel}
          primaryHref={primaryHref}
          secondaryLabel={asString(settings.secondaryLabel) || undefined}
          secondaryHref={asString(settings.secondaryHref) || undefined}
          variant={settings.variant === "default" ? "default" : "primary"}
        />
      </PortalContainer>
    </PortalSection>
  );
}
