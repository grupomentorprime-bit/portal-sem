/**
 * @deprecated
 *
 * Reemplazado por:
 * LibrarySectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { LibrarySectionContent } from "@/components/portal/ecosystem/EcosystemSectionContent";
import type { LibraryItem } from "@/types/content";

interface LibraryGridProps {
  settings: Record<string, unknown>;
}

export function LibraryGrid({ settings }: LibraryGridProps) {
  const items = getResolvedItems<LibraryItem>(settings);
  const limit = getQueryLimit(settings, items.length);

  return (
    <LibrarySectionContent
      items={items.slice(0, limit)}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Biblioteca"),
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, false),
        buttonHref: asString(settings.buttonHref, "/biblioteca"),
        buttonLabel: asString(settings.buttonLabel, "Explorar biblioteca"),
      }}
    />
  );
}
