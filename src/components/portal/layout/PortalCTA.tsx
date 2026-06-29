"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalCTAProps {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "primary";
}

export function PortalCTA({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = "primary",
}: PortalCTAProps) {
  const isPrimaryBg = variant === "primary";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-2xl)] px-6 py-12 text-center sm:px-10 sm:py-16",
        isPrimaryBg
          ? "bg-primary text-text-inverse"
          : "border border-border bg-background shadow-[var(--shadow-md)]"
      )}
    >
      <h2
        className={cn(
          "text-display-s font-semibold",
          isPrimaryBg ? "text-text-inverse" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-body",
            isPrimaryBg ? "text-text-inverse/80" : "text-muted"
          )}
        >
          {description}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button href={primaryHref} variant={isPrimaryBg ? "secondary" : "primary"} size="lg">
          {primaryLabel}
        </Button>
        {secondaryLabel && secondaryHref ? (
          <Button
            href={secondaryHref}
            variant={isPrimaryBg ? "outline" : "outline"}
            size="lg"
            className={isPrimaryBg ? "border-text-inverse/30 text-text-inverse hover:bg-text-inverse/10" : undefined}
          >
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
