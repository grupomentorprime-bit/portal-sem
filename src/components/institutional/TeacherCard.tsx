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
  personItemToPortalPersonCard,
  teacherItemToPersonItem,
} from "@/components/portal/experience/people-grid";
import type { TeacherItem } from "@/lib/institutional/home-content";

interface TeacherCardProps {
  teacher: TeacherItem;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <PortalPersonCard
      person={personItemToPortalPersonCard(
        teacherItemToPersonItem({
          id: teacher.id,
          name: teacher.name,
          role: teacher.role,
          specialty: teacher.specialty,
          image: teacher.image,
        })
      )}
      compact
    />
  );
}
