/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalPersonCard
 *
 * @see docs/core/CORE-PEOPLE-GRID-v1.md
 */

import {
  PortalPersonCard,
  teacherItemToPersonItem,
  personItemToPortalPersonCard,
} from "@/components/portal/experience/people-grid";
import type { TeacherItem } from "@/types/content";

interface TeamCardProps {
  member: TeacherItem;
}

export function TeamCard({ member }: TeamCardProps) {
  return (
    <PortalPersonCard
      person={personItemToPortalPersonCard(teacherItemToPersonItem(member))}
      compact
    />
  );
}
