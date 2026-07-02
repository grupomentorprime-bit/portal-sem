import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
  lines?: number;
  showImage?: boolean;
}

export function CardSkeleton({
  className,
  lines = 3,
  showImage = true,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "institutional-card overflow-hidden p-0",
        className
      )}
      aria-hidden
    >
      {showImage ? (
        <div className="aspect-[16/10] animate-pulse bg-background-soft" />
      ) : null}
      <div className="space-y-3 p-6">
        <div className="h-4 w-1/3 animate-pulse rounded bg-background-soft" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-background-soft" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-background-soft"
            style={{ width: `${90 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 3,
  showImage = true,
}: {
  count?: number;
  showImage?: boolean;
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} showImage={showImage} />
      ))}
    </div>
  );
}
