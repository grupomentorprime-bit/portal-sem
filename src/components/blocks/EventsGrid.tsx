/**
 * @deprecated
 *
 * Reemplazado por:
 * EventsSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { EventsSectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import type { EventItem } from "@/types/content";

interface EventsGridProps {
  settings: Record<string, unknown>;
}

export function EventsGrid({ settings }: EventsGridProps) {
  const items = getResolvedItems<EventItem>(settings);
  const limit = getQueryLimit(settings, items.length);

  return (
    <EventsSectionContent
      items={items.slice(0, limit)}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Próximos eventos"),
        description: asString(settings.description) || undefined,
        buttonHref: asString(settings.buttonHref, "/eventos"),
        buttonLabel: asString(settings.buttonLabel, "Ver agenda"),
      }}
    />
  );
}
