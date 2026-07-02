import { cn } from "@/lib/utils";
import type { ProgramBadgeTone } from "./program-utils";

export type { ProgramBadgeTone };

interface ProgramBadgeProps {
  label: string;
  tone?: ProgramBadgeTone;
  className?: string;
}

export function ProgramBadge({
  label,
  tone = "default",
  className,
}: ProgramBadgeProps) {
  return (
    <span
      className={cn("program-badge", `program-badge--${tone}`, className)}
    >
      {label}
    </span>
  );
}
