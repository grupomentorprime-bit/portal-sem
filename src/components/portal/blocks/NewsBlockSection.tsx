import "server-only";

import {
  PortalNewsGrid,
  newsItemsToPortalNewsCards,
} from "@/components/portal/experience/news-grid";
import type { PortalNewsGridSettings } from "@/types/news-grid";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import { withHomeDemoNews } from "@/lib/portal/institutional-demo";
import type { NewsItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface NewsBlockSectionProps {
  block: PageBlock;
  tenant: string;
  pageSlug?: string;
}

export async function NewsBlockSection({ block, tenant, pageSlug }: NewsBlockSectionProps) {
  const settings = blockSettings<PortalNewsGridSettings>(block);
  let items: NewsItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as NewsItem[]).slice(0, getQueryLimit(block.settings, 3));
  } catch {
    error = true;
  }

  items = withHomeDemoNews(items, pageSlug);

  return (
    <PortalNewsGrid
      settings={settings}
      items={newsItemsToPortalNewsCards(items)}
      error={error}
    />
  );
}
