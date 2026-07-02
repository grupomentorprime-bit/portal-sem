/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalNewsGrid
 *
 * @see docs/core/CORE-NEWS-GRID-v1.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import {
  PortalNewsGrid,
  newsItemsToPortalNewsCards,
} from "@/components/portal/experience/news-grid";
import type { PortalNewsGridSettings } from "@/types/news-grid";
import type { NewsItem } from "@/types/content";

interface NewsSectionContentProps {
  items: NewsItem[];
  settings: PortalNewsGridSettings & { readMoreLabel?: string };
  error?: boolean;
  id?: string;
}

/** @deprecated Usar PortalNewsGrid */
export function NewsSectionContent({
  items,
  settings,
  error = false,
  id = "noticias",
}: NewsSectionContentProps) {
  return (
    <PortalNewsGrid
      settings={{
        overline: settings.overline,
        title: settings.title,
        description: settings.description,
        showButton: asBoolean(settings.showButton, true),
        buttonHref: settings.buttonHref,
        buttonLabel: settings.buttonLabel,
        cardCtaLabel: asString(settings.cardCtaLabel, asString(settings.readMoreLabel, "Leer más")),
        emptyTitle: settings.emptyTitle,
        emptyDescription: settings.emptyDescription,
        emptyActionLabel: settings.emptyActionLabel,
        emptyActionHref: settings.emptyActionHref,
        errorTitle: settings.errorTitle,
        errorDescription: settings.errorDescription,
      }}
      items={newsItemsToPortalNewsCards(items)}
      error={error}
      id={id}
    />
  );
}
