import { cn } from "@/lib/utils";
import type { PortalCTAContentProps } from "@/types/cta-premium";

export function PortalCTAContent({
  overline,
  title,
  description,
  inverse = false,
  centered = true,
  titleId = "portal-cta-premium-title",
  className,
}: PortalCTAContentProps) {
  return (
    <div
      className={cn(
        "portal-cta-premium__content",
        centered && "portal-cta-premium__content--center",
        className
      )}
    >
      {overline ? (
        <p
          className={cn(
            "portal-cta-premium__eyebrow text-caption font-semibold uppercase tracking-widest",
            inverse ? "text-text-inverse/70" : "text-secondary"
          )}
        >
          {overline}
        </p>
      ) : null}
      <h2
        id={titleId}
        className={cn(
          "portal-cta-premium__title text-display-s font-semibold",
          inverse ? "text-text-inverse" : "text-foreground",
          overline && "mt-2"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "portal-cta-premium__description mt-4 max-w-2xl text-body sm:text-lg",
            inverse ? "text-text-inverse/80" : "text-muted",
            centered && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
