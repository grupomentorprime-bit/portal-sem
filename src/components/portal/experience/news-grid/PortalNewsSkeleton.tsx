import { cn } from "@/lib/utils";

interface PortalNewsSkeletonProps {
  count?: number;
  className?: string;
}

export function PortalNewsSkeleton({ count = 3, className }: PortalNewsSkeletonProps) {
  return (
    <div className={cn("portal-news-grid portal-news-grid--skeleton", className)} aria-busy="true" aria-hidden>
      <div className="portal-news-grid__header mb-12 space-y-3">
        <div className="h-4 w-24 rounded bg-background-soft" />
        <div className="h-9 w-full max-w-lg rounded bg-background-soft" />
        <div className="h-5 w-full max-w-md rounded bg-background-soft" />
      </div>
      <ul className="portal-news-grid__list">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index}>
            <div className="portal-news-card portal-news-card--skeleton h-full">
              <div className="portal-news-card__card institutional-card overflow-hidden p-0">
                <div className="portal-news-card__media portal-news-card__media-skeleton aspect-[16/10] animate-pulse bg-background-soft" />
                <div className="space-y-3 p-5 sm:p-6">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-background-soft" />
                    <div className="h-4 w-20 rounded bg-background-soft" />
                  </div>
                  <div className="h-6 w-3/4 rounded bg-background-soft" />
                  <div className="h-4 w-full rounded bg-background-soft" />
                  <div className="h-4 w-5/6 rounded bg-background-soft" />
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="h-4 w-24 rounded bg-background-soft" />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
