import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ColumnActionsProps {
  children: ReactNode;
  className?: string;
}

/** Acciones alineadas al final de una fila. */
export function ColumnActions({ children, className }: ColumnActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>{children}</div>
  );
}
