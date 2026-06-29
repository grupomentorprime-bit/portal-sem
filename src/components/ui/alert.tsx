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
}

const config: Record<
  AlertVariant,
  { icon: LucideIcon; classes: string }
> = {
  info: {
    icon: Info,
    classes: "border-accent/30 bg-accent/10 text-foreground",
  },
  success: {
    icon: CheckCircle2,
    classes: "border-success/30 bg-success/10 text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-light/40 bg-light/15 text-foreground",
  },
  error: {
    icon: AlertCircle,
    classes: "border-primary/20 bg-primary/5 text-foreground",
  },
};

export function Alert({
  variant = "info",
  title,
  className,
  children,
  role = "alert",
  ...props
}: AlertProps) {
  const { icon: Icon, classes } = config[variant];

  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 rounded-[var(--radius-md)] border p-4",
        classes,
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="mb-1 text-sm font-semibold">{title}</p>
        ) : null}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
