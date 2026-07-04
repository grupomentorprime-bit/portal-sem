import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface RightPanelProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  children: ReactNode;
}

/** Panel lateral fijo en desktop; en móvil usar SidePanel/Drawer. */
export function RightPanel({ title, children, className, ...props }: RightPanelProps) {
  return (
    <aside
      className={cn(
        "hidden w-[min(100%,22.5rem)] shrink-0 border-l border-border bg-background xl:block",
        className
      )}
      aria-label={title ?? "Panel lateral"}
      {...props}
    >
      {title ? (
        <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </aside>
  );
}
