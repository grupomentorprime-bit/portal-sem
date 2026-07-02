import { cn } from "@/lib/utils";
import { ProgramBadge } from "./ProgramBadge";
import type { ProgramBadgeTone } from "./program-utils";

export interface ProgramBadgeItem {
  label: string;
  tone: ProgramBadgeTone;
}

interface ProgramBadgeListProps {
  badges: ProgramBadgeItem[];
  className?: string;
}

export function ProgramBadgeList({ badges, className }: ProgramBadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div className={cn("program-badge-list", className)} role="list">
      {badges.map((badge) => (
        <ProgramBadge
          key={badge.label}
          label={badge.label}
          tone={badge.tone}
          className="program-badge-list__item"
        />
      ))}
    </div>
  );
}
