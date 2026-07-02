/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalPeopleGrid
 *
 * @see docs/core/CORE-PEOPLE-GRID-v1.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import {
  PortalPeopleGrid,
  personItemsToPortalPersonCards,
} from "@/components/portal/experience/people-grid";
import type { PersonItem } from "@/types/people-grid";

interface PeopleGridProps {
  settings: Record<string, unknown>;
}

export function PeopleGrid({ settings }: PeopleGridProps) {
  const items = getResolvedItems<PersonItem>(settings);
  const limit = getQueryLimit(settings, 4);

  return (
    <PortalPeopleGrid
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title) || undefined,
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, true),
        buttonHref: asString(settings.buttonHref, "/equipo"),
        buttonLabel: asString(settings.buttonLabel, "Ver equipo completo"),
        cardCtaLabel: asString(settings.cardCtaLabel, "Conocer más"),
        emptyTitle: asString(settings.emptyTitle) || undefined,
        emptyDescription: asString(settings.emptyDescription) || undefined,
      }}
      people={personItemsToPortalPersonCards(items.slice(0, limit))}
    />
  );
}
