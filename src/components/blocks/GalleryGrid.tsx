/**
 * @deprecated
 *
 * Reemplazado por:
 * GallerySectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { GallerySectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import type { GalleryItem } from "@/types/content";

interface GalleryGridProps {
  settings: Record<string, unknown>;
}

export function GalleryGrid({ settings }: GalleryGridProps) {
  const items = getResolvedItems<GalleryItem>(settings);
  const limit = getQueryLimit(settings, items.length);

  return (
    <GallerySectionContent
      overline={asString(settings.overline) || undefined}
      title={asString(settings.title, "Galería")}
      description={asString(settings.description) || undefined}
      items={items.slice(0, limit)}
      showButton={asBoolean(settings.showButton, false)}
      buttonLabel={asString(settings.buttonLabel) || undefined}
      buttonHref={asString(settings.buttonHref) || undefined}
    />
  );
}
