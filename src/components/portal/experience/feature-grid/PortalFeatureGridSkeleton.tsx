import { cn } from "@/lib/utils";

interface PortalFeatureGridSkeletonProps {
  count?: number;
  className?: string;
}

export function PortalFeatureGridSkeleton({
  count = 4,
  className,
}: PortalFeatureGridSkeletonProps) {
  const gridClass =
    count === 3
      ? "portal-feature-grid__grid portal-feature-grid__grid--count-3"
      : count === 6
        ? "portal-feature-grid__grid portal-feature-grid__grid--count-6"
        : count === 8
          ? "portal-feature-grid__grid portal-feature-grid__grid--count-8"
          : count === 12
            ? "portal-feature-grid__grid portal-feature-grid__grid--count-12"
            : "portal-feature-grid__grid";

  return (
    <div className={cn("portal-feature-grid", className)} aria-busy="true" aria-hidden>
      <div className="mb-12 space-y-3">
        <div className="h-4 w-28 rounded bg-background-soft" />
        <div className="h-9 w-full max-w-lg rounded bg-background-soft" />
        <div className="h-5 w-full max-w-md rounded bg-background-soft" />
      </div>
      <ul className={gridClass}>
        {Array.from({ length: count }).map((_, index) => (
          <li key={index}>
            <div className="portal-feature-card portal-feature-card--skeleton h-full">
              <div className="portal-feature-card__inner space-y-4 p-6">
                <div className="h-12 w-12 animate-pulse rounded-[var(--radius-xl)] bg-background-soft" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-background-soft" />
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-background-soft" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-background-soft" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
