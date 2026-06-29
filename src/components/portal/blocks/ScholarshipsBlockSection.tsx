import { ScholarshipsSection } from "@/components/portal/conversion/ScholarshipsSection";
import { blockSettings, extractScholarshipItems } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface ScholarshipsBlockSectionProps {
  block: PageBlock;
}

export function ScholarshipsBlockSection({ block }: ScholarshipsBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
  }>(block);

  return (
    <ScholarshipsSection
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={extractScholarshipItems(block)}
    />
  );
}
