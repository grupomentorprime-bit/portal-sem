import { AdmissionProcessSection } from "@/components/portal/conversion/AdmissionProcessSection";
import { blockSettings, extractProcessSteps } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface AdmissionProcessBlockSectionProps {
  block: PageBlock;
}

export function AdmissionProcessBlockSection({ block }: AdmissionProcessBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
  }>(block);

  return (
    <AdmissionProcessSection
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={extractProcessSteps(block)}
    />
  );
}
