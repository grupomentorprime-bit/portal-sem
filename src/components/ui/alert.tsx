import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { HTMLAttributes } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  size?: "default" | "compact";
}

const config: Record<
  AlertVariant,
  { icon: LucideIcon; classes: string }
> = {
  info: {
    icon: Info,
    classes: "border-[var(--state-info-border)] bg-[var(--state-info-bg)] text-foreground",
  },
  success: {
    icon: CheckCircle2,
    classes: "border-[var(--state-success-border)] bg-[var(--state-success-bg)] text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] text-foreground",
  },
  error: {
    icon: AlertCircle,
    classes: "border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] text-foreground",
  },
};

export function Alert({
  variant = "info",
  title,
  size = "default",
  className,
  children,
  role = "alert",
  ...props
}: AlertProps) {
  const { icon: Icon, classes } = config[variant];
  const compact = size === "compact";

  return (
    <div
      role={role}
      className={cn(
        "flex rounded-[var(--radius-md)] border",
        compact ? "gap-2.5 p-3" : "gap-3 p-4",
        classes,
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          "shrink-0",
          compact ? "mt-0 h-4 w-4" : "mt-0.5 h-5 w-5",
          variant === "success" && "text-[var(--state-success-fg)]",
          variant === "warning" && "text-[var(--state-warning-fg)]",
          variant === "error" && "text-[var(--state-danger-fg)]",
          variant === "info" && "text-[var(--state-info-fg)]"
        )}
        strokeWidth={2.25}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className={cn("font-semibold", compact ? "text-xs" : "mb-1 text-sm")}>{title}</p>
        ) : null}
        <div className={cn(compact ? "text-xs leading-snug" : "text-sm")}>{children}</div>
      </div>
    </div>
  );
}
