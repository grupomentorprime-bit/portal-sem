import { cn } from "@/lib/utils";

interface PortalCTASkeletonProps {
  variant?: "center" | "split" | "banner" | "minimal" | "highlight";
  className?: string;
}

export function PortalCTASkeleton({ variant = "center", className }: PortalCTASkeletonProps) {
  return (
    <div
      className={cn(
        "portal-cta-premium portal-cta-premium--skeleton",
        `portal-cta-premium--${variant}`,
        className
      )}
      aria-busy="true"
      aria-hidden
    >
      <div className="portal-cta-premium__shell overflow-hidden rounded-[var(--radius-2xl)]">
        <div
          className={cn(
            "portal-cta-premium__inner",
            variant === "split" && "portal-cta-premium__inner--media"
          )}
        >
          <div className="portal-cta-premium__body space-y-4 p-8 sm:p-12">
            <div className="mx-auto h-4 w-24 rounded bg-background-soft" />
            <div className="mx-auto h-10 w-full max-w-md rounded bg-background-soft" />
            <div className="mx-auto h-5 w-full max-w-lg rounded bg-background-soft" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <div className="h-12 w-full rounded bg-background-soft sm:w-40" />
              <div className="h-12 w-full rounded bg-background-soft sm:w-44" />
            </div>
          </div>
          {variant === "split" ? (
            <div className="portal-cta-premium__media-wrap portal-cta-premium__media-skeleton aspect-[4/3] animate-pulse bg-background-soft" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
