import "server-only";

import { WhyStudySectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { blockSettings, extractHighlights } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface PresentationBlockSectionProps {
  block: PageBlock;
}

export function PresentationBlockSection({ block }: PresentationBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
  }>(block);

  return (
    <WhyStudySectionContent
      overline={settings.overline}
      title={settings.title}
      subtitle={settings.subtitle}
      description={settings.description}
      highlights={extractHighlights(block)}
    />
  );
}
