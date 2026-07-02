/**
 * @deprecated
 *
 * Reemplazado por:
 * ProgramsSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { ProgramsSectionContent } from "@/components/portal/ProgramsSectionContent";
import type { ProgramItem } from "@/types/content";

interface ProgramsGridProps {
  settings: Record<string, unknown>;
}

export function ProgramsGrid({ settings }: ProgramsGridProps) {
  const items = getResolvedItems<ProgramItem>(settings);
  const limit = getQueryLimit(settings, items.length);
  const programs = items.slice(0, limit);

  return (
    <ProgramsSectionContent
      programs={programs}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Programas"),
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, true),
        buttonHref: asString(settings.buttonHref, "/programas"),
        buttonLabel: asString(settings.buttonLabel, "Ver todos los programas"),
      }}
      id="programas"
      muted
    />
  );
}
