import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface PortalCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function PortalCard({
  children,
  interactive = true,
  className,
  ...props
}: PortalCardProps) {
  return (
    <div
      className={cn("institutional-card", interactive && "h-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}
