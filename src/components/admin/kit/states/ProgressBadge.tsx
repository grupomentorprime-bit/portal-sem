import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface ProgressBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  max?: number;
}

/** Badge compacto con porcentaje. */
export function ProgressBadge({ value, max = 100, className, ...props }: ProgressBadgeProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const complete = pct >= 100;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground",
        className
      )}
      {...props}
    >
      <span className="h-1.5 w-8 overflow-hidden rounded-full bg-[var(--admin-progress-track)]" aria-hidden>
        <span
          className={cn(
            "block h-full rounded-full",
            complete ? "bg-[var(--admin-progress-complete)]" : "bg-[var(--admin-progress-fill)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      {pct}%
    </span>
  );
}
