/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalPeopleGrid
 *
 * @see docs/core/CORE-PEOPLE-GRID-v1.md
 */

import {
  PortalPeopleGrid,
  teacherItemsToPortalPersonCards,
} from "@/components/portal/experience/people-grid";
import type { PortalPeopleGridSettings } from "@/types/people-grid";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import type { TeacherItem } from "@/types/content";

export interface TeachersSectionSettings extends PortalPeopleGridSettings {}

interface TeachersSectionContentProps {
  teachers: TeacherItem[];
  settings: TeachersSectionSettings;
  error?: boolean;
  id?: string;
  muted?: boolean;
}

export function TeachersSectionContent({
  teachers,
  settings,
  error = false,
  id = "equipo",
  muted = false,
}: TeachersSectionContentProps) {
  return (
    <PortalPeopleGrid
      settings={{
        ...settings,
        title: asString(settings.title),
        showButton: asBoolean(settings.showButton, true),
      }}
      people={teacherItemsToPortalPersonCards(teachers)}
      error={error}
      id={id}
      muted={muted}
    />
  );
}
