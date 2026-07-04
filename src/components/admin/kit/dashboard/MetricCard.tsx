import { KpiCard, type KpiCardProps } from "@/components/admin/kit/dashboard/KpiCard";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends Omit<KpiCardProps, "value"> {
  value: string | number;
  /** Serie normalizada 0–1 para barra sparkline simple */
  sparkline?: number[];
}

/** KPI con mini sparkline (sin librería externa). */
export function MetricCard({ sparkline, className, ...props }: MetricCardProps) {
  return (
    <KpiCard className={cn("relative overflow-hidden", className)} {...props}>
      {sparkline?.length ? (
        <div className="mt-3 flex h-8 items-end gap-0.5" aria-hidden>
          {sparkline.map((v, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-primary/20"
              style={{ height: `${Math.max(8, Math.min(100, v * 100))}%` }}
            />
          ))}
        </div>
      ) : null}
    </KpiCard>
  );
}
