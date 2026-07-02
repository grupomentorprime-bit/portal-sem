import type { PortalCTAStatsProps } from "@/types/cta-premium";
import { cn } from "@/lib/utils";

export function PortalCTAStats({ stats, inverse = false, className }: PortalCTAStatsProps) {
  const visible = stats.filter((stat) => stat.visible !== false);
  if (visible.length === 0) return null;

  return (
    <ul className={cn("portal-cta-premium__stats", className)} role="list">
      {visible.map((stat) => (
        <li key={stat.id ?? `${stat.value}-${stat.label}`} className="portal-cta-premium__stat">
          <span
            className={cn(
              "portal-cta-premium__stat-value text-display-s font-semibold",
              inverse ? "text-text-inverse" : "text-secondary"
            )}
          >
            {stat.value}
          </span>
          <span
            className={cn(
              "portal-cta-premium__stat-label mt-1 block text-body",
              inverse ? "text-text-inverse/75" : "text-muted"
            )}
          >
            {stat.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
