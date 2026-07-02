/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalBlockSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import "server-only";

import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { DEFAULT_SETTINGS } from "@/lib/cms/page-defaults";
import { blockSettings, extractResources, findBlock } from "@/lib/portal/blocks";
import {
  EventsSectionContent,
  LibrarySectionContent,
  NewsSectionContent,
  ResourcesSectionContent,
  type EcosystemSectionSettings,
} from "@/components/portal/ecosystem/EcosystemSectionContent";
import type { EventItem, LibraryItem, NewsItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface AcademicEcosystemSectionProps {
  tenant: string;
  blocks?: PageBlock[];
}

function fallbackBlock(type: PageBlock["type"]): PageBlock {
  return {
    id: `${type}-fallback`,
    type,
    visible: true,
    order: 0,
    settings: { ...DEFAULT_SETTINGS[type] },
  };
}

export async function AcademicEcosystemSection({
  tenant,
  blocks,
}: AcademicEcosystemSectionProps) {
  const newsBlock = findBlock(blocks, "news") ?? fallbackBlock("news");
  const eventsBlock = findBlock(blocks, "events") ?? fallbackBlock("events");
  const libraryBlock = findBlock(blocks, "library") ?? fallbackBlock("library");
  const resourcesBlock = findBlock(blocks, "resources") ?? fallbackBlock("resources");

  const newsSettings = blockSettings<EcosystemSectionSettings>(newsBlock);
  const eventsSettings = blockSettings<EcosystemSectionSettings>(eventsBlock);
  const librarySettings = blockSettings<EcosystemSectionSettings>(libraryBlock);
  const resourcesSettings = blockSettings<EcosystemSectionSettings>(resourcesBlock);
  const resources = extractResources(resourcesBlock);

  let news: NewsItem[] = [];
  let events: EventItem[] = [];
  let library: LibraryItem[] = [];
  let newsError = false;
  let eventsError = false;
  let libraryError = false;

  try {
    const [newsItems, eventItems, libraryItems] = await Promise.all([
      resolveBlockContent(newsBlock, tenant),
      resolveBlockContent(eventsBlock, tenant),
      resolveBlockContent(libraryBlock, tenant),
    ]);

    news = (newsItems as NewsItem[]).slice(0, getQueryLimit(newsBlock.settings, 4));
    events = (eventItems as EventItem[]).slice(0, getQueryLimit(eventsBlock.settings, 4));
    library = (libraryItems as LibraryItem[]).slice(0, getQueryLimit(libraryBlock.settings, 4));
  } catch {
    newsError = true;
    eventsError = true;
    libraryError = true;
  }

  return (
    <>
      <NewsSectionContent items={news} settings={newsSettings} error={newsError} />
      <EventsSectionContent items={events} settings={eventsSettings} error={eventsError} />
      <LibrarySectionContent items={library} settings={librarySettings} error={libraryError} />
      <ResourcesSectionContent items={resources} settings={resourcesSettings} />
    </>
  );
}
