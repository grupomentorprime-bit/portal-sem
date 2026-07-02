import { cn } from "@/lib/utils";

interface PortalTimelineSkeletonProps {
  count?: number;
  layout?: "horizontal" | "vertical" | "auto";
  className?: string;
}

export function PortalTimelineSkeleton({
  count = 4,
  layout = "auto",
  className,
}: PortalTimelineSkeletonProps) {
  return (
    <div
      className={cn(
        "portal-timeline portal-timeline--skeleton",
        `portal-timeline--layout-${layout}`,
        className
      )}
      aria-busy="true"
      aria-hidden
    >
      <div className="portal-timeline__header mb-12 space-y-3">
        <div className="h-4 w-24 rounded bg-background-soft" />
        <div className="h-9 w-full max-w-lg rounded bg-background-soft" />
        <div className="h-5 w-full max-w-md rounded bg-background-soft" />
      </div>
      <ol className="portal-timeline__track">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="portal-timeline__step">
            <div className="portal-timeline__item portal-timeline__item--skeleton">
              <div className="portal-timeline__marker-wrap">
                <div className="portal-timeline__marker h-10 w-10 animate-pulse rounded-full bg-background-soft" />
              </div>
              <div className="portal-timeline__content mt-4 space-y-2 sm:mt-0">
                <div className="h-5 w-3/4 animate-pulse rounded bg-background-soft" />
                <div className="h-3 w-full animate-pulse rounded bg-background-soft" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-background-soft" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
