import "server-only";

import { AcademicAgendaSectionContent } from "@/components/portal/ecosystem/AcademicAgendaSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { AcademicAgendaItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface AcademicAgendaBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function AcademicAgendaBlockSection({
  block,
  tenant,
}: AcademicAgendaBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  let items: AcademicAgendaItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as AcademicAgendaItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return <AcademicAgendaSectionContent items={items} settings={settings} error={error} />;
}
