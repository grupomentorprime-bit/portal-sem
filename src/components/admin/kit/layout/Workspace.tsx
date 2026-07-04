import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface WorkspaceProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: "default" | "full";
}

/** Área principal del Layout Maestro. */
export function Workspace({ className, maxWidth = "default", ...props }: WorkspaceProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full flex-1 px-4 py-5 sm:px-6 lg:py-6",
        maxWidth === "default" && "max-w-[90rem]",
        className
      )}
      {...props}
    />
  );
}
