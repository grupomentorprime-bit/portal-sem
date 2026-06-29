import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type SectionPadding = "none" | "sm" | "md" | "lg" | "xl";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  padding?: SectionPadding;
  muted?: boolean;
}

const paddingClasses: Record<SectionPadding, string> = {
  none: "",
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  xl: "py-24",
};

export function Section({
  padding = "md",
  muted = false,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        paddingClasses[padding],
        muted && "bg-background-muted",
        className
      )}
      {...props}
    />
  );
}
