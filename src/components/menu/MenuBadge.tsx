"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

interface MenuBadgeProps {
  label: string;
  color?: string;
  highlighted?: boolean;
}

export function MenuBadge({ label, color, highlighted }: MenuBadgeProps) {
  if (!label) return null;

  return (
    <span
      style={
        color
          ? ({ ["--menu-badge-color" as string]: color } as CSSProperties)
          : undefined
      }
      className={cn(
        "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        highlighted
          ? "bg-[var(--state-warning-bg)] text-[var(--color-warning)]"
          : color
            ? "bg-[color-mix(in_srgb,var(--menu-badge-color)_13%,transparent)] text-[var(--menu-badge-color)]"
            : "bg-background-muted text-muted"
      )}
    >
      {label}
    </span>
  );
}
