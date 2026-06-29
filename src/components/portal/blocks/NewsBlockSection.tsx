import "server-only";

import { NewsSectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { NewsItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface NewsBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function NewsBlockSection({ block, tenant }: NewsBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  let items: NewsItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as NewsItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return <NewsSectionContent items={items} settings={settings} error={error} />;
}
