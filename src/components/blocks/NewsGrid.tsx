/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalNewsGrid
 *
 * @see docs/core/CORE-NEWS-GRID-v1.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import {
  PortalNewsGrid,
  newsItemsToPortalNewsCards,
} from "@/components/portal/experience/news-grid";
import type { NewsItem } from "@/types/content";

interface NewsGridProps {
  settings: Record<string, unknown>;
}

export function NewsGrid({ settings }: NewsGridProps) {
  const items = getResolvedItems<NewsItem>(settings);
  const limit = getQueryLimit(settings, 3);

  return (
    <PortalNewsGrid
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title) || undefined,
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, true),
        buttonHref: asString(settings.buttonHref, "/noticias"),
        buttonLabel: asString(settings.buttonLabel, "Ver todas las noticias"),
        cardCtaLabel: asString(settings.readMoreLabel, "Leer más"),
        emptyTitle: asString(settings.emptyTitle) || undefined,
        emptyDescription: asString(settings.emptyDescription) || undefined,
      }}
      items={newsItemsToPortalNewsCards(items.slice(0, limit))}
    />
  );
}
