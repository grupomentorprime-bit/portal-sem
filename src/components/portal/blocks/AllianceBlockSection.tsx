import { AllianceSection } from "@/components/portal/conversion/AllianceSection";
import { blockSettings } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface AllianceBlockSectionProps {
  block: PageBlock;
  organization?: string;
  logoSecondary?: string;
}

export function AllianceBlockSection({
  block,
  organization,
  logoSecondary,
}: AllianceBlockSectionProps) {
  const settings = blockSettings<{
    title?: string;
    description?: string;
  }>(block);

  return (
    <AllianceSection
      title={settings.title}
      description={settings.description}
      organization={organization}
      logoSecondary={logoSecondary}
    />
  );
}
