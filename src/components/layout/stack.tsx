import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type StackGap = 1 | 2 | 4 | 6 | 8 | 12 | 16;

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: StackGap;
  direction?: "vertical" | "horizontal";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
}

const gapClasses: Record<StackGap, string> = {
  1: "gap-1",
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
  12: "gap-12",
  16: "gap-16",
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function Stack({
  gap = 4,
  direction = "vertical",
  align = "stretch",
  justify = "start",
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
}
