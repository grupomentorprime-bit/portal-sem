import "server-only";

import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { DEFAULT_SETTINGS } from "@/lib/cms/page-defaults";
import { blockSettings } from "@/lib/portal/blocks";
import type { ProgramsSectionSettings } from "@/components/portal/ProgramsSectionContent";
import { ProgramsSectionContent } from "@/components/portal/ProgramsSectionContent";
import type { ProgramItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface ProgramsSectionProps {
  tenant: string;
  block?: PageBlock;
  id?: string;
  muted?: boolean;
}

function fallbackProgramsBlock(): PageBlock {
  return {
    id: "programs-fallback",
    type: "programs",
    visible: true,
    order: 0,
    settings: { ...DEFAULT_SETTINGS.programs },
  };
}

export async function ProgramsSection({
  tenant,
  block,
  id = "programas-destacados",
  muted = false,
}: ProgramsSectionProps) {
  const resolvedBlock = block ?? fallbackProgramsBlock();
  const settings = blockSettings<ProgramsSectionSettings>(resolvedBlock);

  let programs: ProgramItem[] = [];
  let error = false;

  try {
    const items = await resolveBlockContent(resolvedBlock, tenant);
    const limit = getQueryLimit(resolvedBlock.settings, 3);
    programs = (items as ProgramItem[]).slice(0, limit);
  } catch {
    error = true;
  }

  return (
    <ProgramsSectionContent
      programs={programs}
      settings={settings}
      error={error}
      id={id}
      muted={muted}
    />
  );
}
