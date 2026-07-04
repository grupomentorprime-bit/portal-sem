import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface BulkActionsProps {
  selectedCount: number;
  children: ReactNode;
  className?: string;
}

/** Barra de acciones masivas sobre selección. */
export function BulkActions({ selectedCount, children, className }: BulkActionsProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background-soft px-4 py-2 text-sm",
        className
      )}
      role="status"
    >
      <span className="font-medium text-foreground">{selectedCount} seleccionados</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
