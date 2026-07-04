import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";

export interface ProgressCardProps {
  label: string;
  value: number;
  max?: number;
  hint?: string;
  className?: string;
}

/** Progreso hacia una meta — azul institucional; verde al completar. */
export function ProgressCard({ label, value, max = 100, hint, className }: ProgressCardProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const complete = pct >= 100;

  return (
    <div className={cn(aek.surface, "p-4 shadow-[var(--admin-shadow-card)]", className)}>
      <div className="flex items-end justify-between gap-2">
        <p className={aek.label}>{label}</p>
        <span className="text-sm font-bold text-foreground">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--admin-progress-track)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            complete ? "bg-[var(--admin-progress-complete)]" : "bg-[var(--admin-progress-fill)]"
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {hint ? <p className={cn(aek.meta, "mt-2")}>{hint}</p> : null}
    </div>
  );
}
