import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  success:
    "bg-[var(--state-success-bg)] text-[var(--state-success-fg)] border-[var(--state-success-border)]",
  warning:
    "bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)] border-[var(--state-warning-border)]",
  error:
    "bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)] border-[var(--state-danger-border)]",
  info: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)] border-[var(--state-info-border)]",
  neutral: "bg-background-muted text-muted border-border",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
