import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type ContentGridCols = 1 | 2 | 3 | 4 | 5;

export interface ContentGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: ContentGridCols;
}

const colClass: Record<ContentGridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

/** Grid responsivo para cards y tiles administrativos. */
export function ContentGrid({ cols = 3, className, ...props }: ContentGridProps) {
  return <div className={cn("grid gap-4", colClass[cols], className)} {...props} />;
}
