import "server-only";

import { StatsSectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { blockSettings, extractStats } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";

interface StatsBlockSectionProps {
  block: PageBlock;
}

export function StatsBlockSection({ block }: StatsBlockSectionProps) {
  const settings = blockSettings<{ overline?: string; title?: string }>(block);

  return (
    <StatsSectionContent
      overline={settings.overline}
      title={settings.title}
      stats={extractStats(block)}
    />
  );
}
