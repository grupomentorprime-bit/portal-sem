import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-[1400px]",
} as const;

interface PortalContainerProps {
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
}

export function PortalContainer({
  children,
  size = "lg",
  className,
}: PortalContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
}

interface PortalSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  muted?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20",
  lg: "py-20 sm:py-28",
};

export function PortalSection({
  children,
  id,
  className,
  muted,
  padding = "lg",
}: PortalSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        paddingMap[padding],
        muted && "bg-background-soft",
        className
      )}
    >
      {children}
    </section>
  );
}
