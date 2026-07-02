import { cn } from "@/lib/utils";
import type { PortalCatalogCardVariant } from "@/types/catalog-card";

interface PortalCatalogCardSkeletonProps {
  variant?: PortalCatalogCardVariant;
  className?: string;
}

export function PortalCatalogCardSkeleton({
  variant = "default",
  className,
}: PortalCatalogCardSkeletonProps) {
  const resolvedVariant = variant;

  return (
    <div
      className={cn(
        "portal-catalog-card portal-catalog-card--skeleton",
        `portal-catalog-card--${resolvedVariant}`,
        className
      )}
      aria-busy="true"
      aria-hidden
    >
      <div className="portal-catalog-card__card institutional-card overflow-hidden p-0">
        <div
          className={cn(
            resolvedVariant === "horizontal" && "portal-catalog-card__horizontal"
          )}
        >
          <div
            className={cn(
              "portal-catalog-card__media portal-catalog-card__media-skeleton animate-pulse",
              resolvedVariant !== "default" &&
                `portal-catalog-card__media--${resolvedVariant}`
            )}
          />
          <div className="portal-catalog-card__body space-y-3 p-5 sm:p-6">
            <div className="h-4 w-24 rounded bg-background-soft" />
            <div className="h-6 w-3/4 rounded bg-background-soft" />
            <div className="h-4 w-full rounded bg-background-soft" />
            <div className="h-4 w-5/6 rounded bg-background-soft" />
            {resolvedVariant !== "minimal" ? (
              <div className="flex gap-4 pt-2">
                <div className="h-3 w-20 rounded bg-background-soft" />
                <div className="h-3 w-16 rounded bg-background-soft" />
              </div>
            ) : null}
            <div className="mt-4 border-t border-border pt-4">
              <div className="h-4 w-32 rounded bg-background-soft" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
