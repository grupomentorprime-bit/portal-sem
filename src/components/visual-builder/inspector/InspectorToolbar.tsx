import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InspectorToolbarProps {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function InspectorToolbar({
  title,
  subtitle,
  status,
  actions,
  className,
}: InspectorToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
