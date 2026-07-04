import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type KpiVariant = "neutral" | "success" | "warning" | "info";

/** Acento visual — color solo en borde e icono, no en toda la tarjeta. */
export type KpiAccent = "primary" | "success" | "warning" | "info" | "neutral";

export interface KpiCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  delta?: string;
  /** Tono del texto delta */
  variant?: KpiVariant;
  /** Acento de borde e icono */
  accent?: KpiAccent;
  icon?: ReactNode;
  /** metric-first: número dominante (OT-SEM-DASHBOARD-002) */
  layout?: "classic" | "metric-first";
}

const deltaTone: Record<KpiVariant, string> = {
  neutral: "text-muted",
  success: "text-[var(--state-success-fg)]",
  warning: "text-[var(--state-warning-fg)]",
  info: "text-[var(--state-info-fg)]",
};

const accentBorder: Record<KpiAccent, string> = {
  primary: "border-l-[3px] border-l-[var(--admin-kpi-accent-primary)]",
  success: "border-l-[3px] border-l-[var(--admin-kpi-accent-success)]",
  warning: "border-l-[3px] border-l-[var(--admin-kpi-accent-warning)]",
  info: "border-l-[3px] border-l-[var(--admin-kpi-accent-info)]",
  neutral: "border-l-[3px] border-l-border",
};

const accentIcon: Record<KpiAccent, string> = {
  primary: "bg-[var(--state-info-bg)] text-[var(--admin-kpi-accent-primary)]",
  success: "bg-[var(--state-success-bg)] text-[var(--state-success-fg)]",
  warning: "bg-[var(--state-warning-bg)] text-[var(--state-warning-fg)]",
  info: "bg-[var(--state-info-bg)] text-[var(--state-info-fg)]",
  neutral: "bg-background-muted text-muted",
};

/** Métrica numérica — fondo blanco, número protagonista, acento mínimo. */
export function KpiCard({
  label,
  value,
  delta,
  variant = "neutral",
  accent = "primary",
  icon,
  layout = "metric-first",
  className,
  ...props
}: KpiCardProps) {
  if (layout === "classic") {
    return (
      <div
        className={cn(
          aek.surface,
          "p-4 shadow-[var(--admin-shadow-card)]",
          accentBorder[accent],
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <p className={aek.label}>{label}</p>
          {icon ? (
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                accentIcon[accent]
              )}
              aria-hidden
            >
              {icon}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
        {delta ? (
          <p className={cn("mt-1.5 text-xs font-medium", deltaTone[variant])}>{delta}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        aek.surface,
        "relative p-4 shadow-[var(--admin-shadow-card)]",
        accentBorder[accent],
        className
      )}
      {...props}
    >
      {icon ? (
        <span
          className={cn(
            "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)]",
            accentIcon[accent]
          )}
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <p className="text-3xl font-bold leading-none tracking-tight text-foreground sm:text-[2rem]">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
      {delta ? (
        <p className={cn("mt-1 text-xs font-normal", deltaTone[variant])}>{delta}</p>
      ) : null}
    </div>
  );
}
