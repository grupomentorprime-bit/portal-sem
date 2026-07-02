/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalPeopleGrid
 *
 * @see docs/core/CORE-PEOPLE-GRID-v1.md
 */

import { TeachersSectionContent } from "@/components/portal/TeachersSectionContent";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { asBoolean, asString, type TeacherItemSettings } from "@/lib/cms/block-utils";
import type { TeacherItem } from "@/types/content";

interface TeachersGridProps {
  settings: Record<string, unknown>;
}

export function TeachersGrid({ settings }: TeachersGridProps) {
  const items = getResolvedItems<TeacherItemSettings>(settings);
  const limit = getQueryLimit(settings, items.length);
  const teachers: TeacherItem[] = items.slice(0, limit).map((teacher) => ({
    id: teacher.id,
    name: asString(teacher.name),
    role: asString(teacher.role),
    specialty: asString(teacher.specialty),
    image: teacher.image,
  }));

  if (teachers.length === 0) return null;

  return (
    <TeachersSectionContent
      teachers={teachers}
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title, "Equipo"),
        description: asString(settings.description) || undefined,
        showButton: asBoolean(settings.showButton, false),
        buttonHref: asString(settings.buttonHref, "/equipo"),
        buttonLabel: asString(settings.buttonLabel, "Ver todo el equipo"),
        cardCtaLabel: asString(settings.cardCtaLabel, "Conocer más"),
      }}
      id="equipo"
      muted
    />
  );
}
