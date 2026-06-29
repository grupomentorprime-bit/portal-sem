import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type CardVariant = "default" | "outlined" | "elevated" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: "border border-border bg-background",
  outlined: "border-2 border-border bg-background",
  elevated: "border border-border bg-background shadow-[var(--shadow-md)]",
  interactive:
    "border border-border bg-background shadow-[var(--shadow-sm)] hover-lift cursor-pointer hover:shadow-[var(--shadow-md)]",
};

export function Card({
  variant = "default",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] p-6 transition-[box-shadow,transform] duration-[var(--transition-fast)]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex items-center gap-2 border-t border-border pt-4", className)}
      {...props}
    />
  );
}
