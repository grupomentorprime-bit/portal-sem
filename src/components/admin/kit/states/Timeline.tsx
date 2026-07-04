import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/** Línea de tiempo vertical para auditoría o actividad. */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {index < items.length - 1 ? (
            <span
              className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-border"
              aria-hidden
            />
          ) : null}
          <span className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">{item.title}</span>
              <time className="text-xs text-muted">{item.time}</time>
            </div>
            {item.description ? (
              <p className="mt-0.5 text-sm text-muted">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
