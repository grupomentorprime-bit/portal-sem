import { Skeleton } from "@/components/ui/skeleton";
import { aek } from "@/components/admin/kit/utils/tokens";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  variant?: "cards" | "table" | "detail";
  rows?: number;
  className?: string;
}

/** Skeleton de carga inicial. */
export function LoadingState({ variant = "table", rows = 5, className }: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={cn(aek.surface, "space-y-3 p-4")}>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn(aek.surface, "overflow-hidden", className)}>
      <div className="border-b border-border bg-background-soft px-4 py-3">
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border px-4 py-3 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
