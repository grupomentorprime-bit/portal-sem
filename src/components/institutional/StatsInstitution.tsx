/**
 * @deprecated
 *
 * Reemplazado por:
 * StatsSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { cn } from "@/lib/utils";
import type { StatItem } from "@/lib/institutional/home-content";

interface StatsInstitutionProps {
  stats: StatItem[];
  className?: string;
}

export function StatsInstitution({ stats, className }: StatsInstitutionProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-8 md:grid-cols-4",
        className
      )}
      role="list"
    >
      {stats.map((stat) => (
        <div key={stat.id} role="listitem" className="text-center animate-scale-in">
          <p className="text-display-xl text-accent">{stat.value}</p>
          <p className="mt-2 text-caption font-medium text-text-inverse/80">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
