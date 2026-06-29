import { FaqSection } from "@/components/portal/conversion/FaqSection";
import { blockSettings, extractFaqItems } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface FaqBlockSectionProps {
  block: PageBlock;
}

export function FaqBlockSection({ block }: FaqBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
  }>(block);

  return (
    <FaqSection
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={extractFaqItems(block)}
    />
  );
}
