import type { CSSProperties } from "react";
import type { PortalCatalogCardProps } from "@/types/catalog-card";
import { cn } from "@/lib/utils";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import { PortalCatalogBadge } from "./PortalCatalogBadge";
import { PortalCatalogCTA } from "./PortalCatalogCTA";
import { PortalCatalogImage } from "./PortalCatalogImage";
import { PortalCatalogMeta } from "./PortalCatalogMeta";

export function PortalCatalogCard({
  id,
  image,
  imageIcon,
  title,
  description,
  badge,
  category,
  modality,
  duration,
  level,
  color,
  url,
  featured = false,
  comingSoon = false,
  disabled = false,
  variant = "default",
  ctaLabel = "Más información",
  priorityImage = false,
  staggerIndex = 0,
  className,
}: PortalCatalogCardProps) {
  if (disabled) return null;

  const resolvedVariant = featured && variant === "default" ? "featured" : variant;
  const titleId = `catalog-card-${id}-title`;
  const accentStyle = color
    ? ({ "--catalog-accent": color } as CSSProperties)
    : undefined;

  const displayBadge = comingSoon
    ? undefined
    : badge || category;
  const badgeTone = comingSoon
    ? "coming-soon"
    : featured
      ? "featured"
      : "default";
  const badgeLabel = comingSoon ? "Próximamente" : displayBadge;

  const showMeta = resolvedVariant !== "minimal";
  const descriptionClamp =
    resolvedVariant === "compact" ? "line-clamp-1" : "line-clamp-2";

  return (
    <article
      className={cn(
        "portal-catalog-card group flex h-full flex-col",
        `portal-catalog-card--${resolvedVariant}`,
        staggerIndex > 0 && `portal-catalog-card--stagger-${Math.min(staggerIndex, 3)}`,
        className
      )}
      aria-labelledby={titleId}
      style={accentStyle}
      data-cursor="card"
    >
      <PortalCard
        interactive={!comingSoon}
        className="portal-catalog-card__card flex h-full flex-col overflow-hidden p-0"
      >
        <div
          className={cn(
            resolvedVariant === "horizontal" && "portal-catalog-card__horizontal"
          )}
        >
          <div className="relative shrink-0">
            <PortalCatalogImage
              src={image}
              alt={title}
              icon={imageIcon}
              priority={priorityImage}
              variant={resolvedVariant}
            />
            {badgeLabel ? (
              <div className="absolute left-4 top-4 z-[1]">
                <PortalCatalogBadge
                  label={badgeLabel}
                  icon={imageIcon}
                  tone={badgeTone}
                />
              </div>
            ) : null}
          </div>

          <div className="portal-catalog-card__body flex flex-1 flex-col">
            <h3
              id={titleId}
              className="portal-catalog-card__title text-heading text-foreground"
            >
              {title}
            </h3>

            {description ? (
              <p
                className={cn(
                  "portal-catalog-card__description mt-2 flex-1 text-body text-muted",
                  descriptionClamp
                )}
              >
                {description}
              </p>
            ) : (
              <div className="flex-1" />
            )}

            {showMeta ? (
              <PortalCatalogMeta
                modality={modality}
                duration={duration}
                level={level}
                variant={resolvedVariant}
                className="mt-4"
              />
            ) : null}

            <div className="portal-catalog-card__footer mt-5 border-t border-border pt-4">
              <PortalCatalogCTA
                href={url}
                label={ctaLabel}
                comingSoon={comingSoon}
              />
            </div>
          </div>
        </div>
      </PortalCard>
    </article>
  );
}
