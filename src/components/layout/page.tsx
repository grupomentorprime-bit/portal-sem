import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface PageProps extends HTMLAttributes<HTMLDivElement> {
  centered?: boolean;
}

export function Page({ centered = false, className, ...props }: PageProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        centered && "flex items-center justify-center",
        className
      )}
      {...props}
    />
  );
}
