/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalProgramsSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asBoolean, asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { PortalProgramsSection } from "@/components/portal/programs";
import type { ProgramItem } from "@/types/content";

interface AcademicOfferGridProps {
  settings: Record<string, unknown>;
}

export function AcademicOfferGrid({ settings }: AcademicOfferGridProps) {
  const items = getResolvedItems<ProgramItem>(settings);
  const limit = getQueryLimit(settings, 3);
  const programs = items.slice(0, limit);

  return (
    <PortalProgramsSection
      programs={programs}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Programas que transforman vidas"),
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, true),
        buttonHref: asString(settings.buttonHref, "/programas"),
        buttonLabel: asString(settings.buttonLabel, "Ver todos los programas"),
        cardCtaLabel: asString(settings.cardCtaLabel, "Más información"),
      }}
      id="oferta-academica"
    />
  );
}
