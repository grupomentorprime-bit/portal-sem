import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({
  size = "md",
  className,
  label = "Cargando",
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-border border-t-accent",
        sizeClasses[size],
        className
      )}
    />
  );
}
