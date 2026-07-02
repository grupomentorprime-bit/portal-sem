import { cn } from "@/lib/utils";

interface PortalPeopleSkeletonProps {
  count?: number;
  className?: string;
}

export function PortalPeopleSkeleton({ count = 4, className }: PortalPeopleSkeletonProps) {
  return (
    <div className={cn("portal-people-grid portal-people-grid--skeleton", className)} aria-busy="true" aria-hidden>
      <div className="portal-people-grid__header mb-12 space-y-3">
        <div className="h-4 w-24 rounded bg-background-soft" />
        <div className="h-9 w-full max-w-lg rounded bg-background-soft" />
        <div className="h-5 w-full max-w-md rounded bg-background-soft" />
      </div>
      <ul className="portal-people-grid__list">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index}>
            <div className="portal-person-card portal-person-card--skeleton h-full">
              <div className="portal-person-card__card institutional-card overflow-hidden p-0">
                <div className="portal-person-card__media portal-person-card__media-skeleton aspect-[4/5] animate-pulse bg-background-soft" />
                <div className="space-y-3 p-5 sm:p-6">
                  <div className="h-6 w-3/4 mx-auto rounded bg-background-soft" />
                  <div className="h-4 w-1/2 mx-auto rounded bg-background-soft" />
                  <div className="h-4 w-2/3 mx-auto rounded bg-background-soft" />
                  <div className="h-4 w-full rounded bg-background-soft" />
                  <div className="h-4 w-5/6 rounded bg-background-soft" />
                  <div className="mt-4 flex justify-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-background-soft" />
                    <div className="h-8 w-8 rounded-full bg-background-soft" />
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="mx-auto h-9 w-32 rounded bg-background-soft" />
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
