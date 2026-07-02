import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  className,
  variant = "rectangular",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-[skeleton-pulse_1.5s_ease-in-out_infinite] bg-gray-100",
        variant === "text" && "h-4 w-full rounded-[var(--radius-sm)]",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-[var(--radius-md)]",
        className
      )}
    />
  );
}
