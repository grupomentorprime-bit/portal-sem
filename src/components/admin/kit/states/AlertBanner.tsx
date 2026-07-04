import { Alert, type AlertVariant } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

/** Banner persistente inline (no toast). */
export function AlertBanner({
  variant = "info",
  title,
  children,
  className,
  compact = false,
}: AlertBannerProps) {
  return (
    <Alert
      variant={variant}
      title={title}
      size={compact ? "compact" : "default"}
      className={cn(compact && "mb-0", className)}
    >
      {children}
    </Alert>
  );
}
