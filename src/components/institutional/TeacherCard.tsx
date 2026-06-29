import { Avatar } from "@/components/ui";
import { InstitutionalCard } from "./InstitutionalCard";
import type { TeacherItem } from "@/lib/institutional/home-content";

interface TeacherCardProps {
  teacher: TeacherItem;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <InstitutionalCard className="text-center animate-scale-in">
      <div className="mx-auto mb-4">
        <Avatar name={teacher.name} size="xl" src={teacher.image} />
      </div>
      <h3 className="text-heading text-foreground">{teacher.name}</h3>
      <p className="mt-1 text-caption font-medium text-secondary">{teacher.role}</p>
      <p className="mt-2 text-body text-muted">{teacher.specialty}</p>
    </InstitutionalCard>
  );
}
