import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12;
type GridGap = 2 | 4 | 6 | 8 | 12;

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  smCols?: GridCols;
  mdCols?: GridCols;
  lgCols?: GridCols;
  gap?: GridGap;
}

const colClasses: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  10: "grid-cols-10",
  12: "grid-cols-12",
};

const smColClasses: Record<GridCols, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  10: "sm:grid-cols-10",
  12: "sm:grid-cols-12",
};

const mdColClasses: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  10: "md:grid-cols-10",
  12: "md:grid-cols-12",
};

const lgColClasses: Record<GridCols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  10: "lg:grid-cols-10",
  12: "lg:grid-cols-12",
};

const gapClasses: Record<GridGap, string> = {
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
  12: "gap-12",
};

export function Grid({
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  gap = 4,
  className,
  ...props
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        colClasses[cols],
        smCols && smColClasses[smCols],
        mdCols && mdColClasses[mdCols],
        lgCols && lgColClasses[lgCols],
        gapClasses[gap],
        className
      )}
      {...props}
    />
  );
}
