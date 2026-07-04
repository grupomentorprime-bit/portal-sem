import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface InlineActionsProps {
  children: ReactNode;
  align?: "start" | "end" | "between";
  className?: string;
}

/** Fila de acciones en formularios. */
export function InlineActions({ children, align = "end", className }: InlineActionsProps) {
  const alignClass = {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
  }[align];

  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-2", alignClass, className)}>
      {children}
    </div>
  );
}
