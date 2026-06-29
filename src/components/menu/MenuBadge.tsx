"use client";

import { cn } from "@/lib/utils";

interface MenuBadgeProps {
  label: string;
  color?: string;
  highlighted?: boolean;
}

export function MenuBadge({ label, color, highlighted }: MenuBadgeProps) {
  if (!label) return null;

  return (
    <span
      className={cn(
        "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        highlighted ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"
      )}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      {label}
    </span>
  );
}
