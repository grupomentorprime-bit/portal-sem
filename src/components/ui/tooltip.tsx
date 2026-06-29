"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible ? (
        <span
          role="tooltip"
          className={cn(
            "absolute z-[var(--z-tooltip)] whitespace-nowrap rounded-[var(--radius-sm)] bg-primary px-2 py-1 text-xs text-text-inverse shadow-[var(--shadow-md)]",
            position === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "top-full left-1/2 mt-2 -translate-x-1/2"
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
