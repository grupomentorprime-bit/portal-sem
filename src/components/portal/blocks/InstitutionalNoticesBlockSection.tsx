import "server-only";

import { InstitutionalNoticesSectionContent } from "@/components/portal/ecosystem/InstitutionalNoticesSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { InstitutionalNoticeItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface InstitutionalNoticesBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function InstitutionalNoticesBlockSection({
  block,
  tenant,
}: InstitutionalNoticesBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  let items: InstitutionalNoticeItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as InstitutionalNoticeItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return <InstitutionalNoticesSectionContent items={items} settings={settings} error={error} />;
}
