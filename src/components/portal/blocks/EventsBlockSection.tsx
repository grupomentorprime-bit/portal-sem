import "server-only";

import { EventsSectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { EventItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface EventsBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function EventsBlockSection({ block, tenant }: EventsBlockSectionProps) {
  const settings = blockSettings<EcosystemSectionSettings>(block);
  let items: EventItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as EventItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return <EventsSectionContent items={items} settings={settings} error={error} />;
}
