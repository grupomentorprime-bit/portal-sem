import "server-only";

import { LibrarySectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { LibraryItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface LibraryBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function LibraryBlockSection({ block, tenant }: LibraryBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  let items: LibraryItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as LibraryItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return <LibrarySectionContent items={items} settings={settings} error={error} />;
}
