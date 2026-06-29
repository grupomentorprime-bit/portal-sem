import { Avatar } from "@/components/ui";
import type { TeacherItem } from "@/types/content";
import { PortalCard } from "./PortalCard";

interface TeamCardProps {
  member: TeacherItem;
}

export function TeamCard({ member }: TeamCardProps) {
  return (
    <PortalCard className="animate-scale-in p-6 text-center">
      <div className="mx-auto mb-4">
        <Avatar name={member.name} size="xl" src={member.image} />
      </div>
      <h3 className="text-heading text-foreground">{member.name}</h3>
      {member.role ? (
        <p className="mt-1 text-caption font-medium text-secondary">{member.role}</p>
      ) : null}
      {member.specialty ? (
        <p className="mt-2 text-body text-muted">{member.specialty}</p>
      ) : null}
    </PortalCard>
  );
}
