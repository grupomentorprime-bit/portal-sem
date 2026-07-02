import type { CSSProperties, ElementType } from "react";
import Link from "next/link";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import type { PortalTimelineItem as TimelineItem } from "@/types/timeline";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<NonNullable<TimelineItem["status"]>, string> = {
  pending: "Pendiente",
  active: "Activo",
  completed: "Completado",
  upcoming: "Próximamente",
};

interface PortalTimelineItemProps {
  item: TimelineItem;
  isActive?: boolean;
  showDate?: boolean;
  staggerIndex?: number;
}

export function PortalTimelineItem({
  item,
  isActive = false,
  showDate = false,
  staggerIndex = 0,
}: PortalTimelineItemProps) {
  const titleId = `timeline-${item.id}-title`;
  const accentStyle = item.color
    ? ({ "--timeline-accent": item.color } as CSSProperties)
    : undefined;
  const hasUrl = Boolean(item.url?.trim());
  const Wrapper: ElementType = hasUrl ? Link : "div";
  const status = item.status;
  const statusLabel = status ? STATUS_LABELS[status] : undefined;

  const wrapperProps = hasUrl
    ? {
        href: item.url!,
        className: cn("portal-timeline__item-link block", focusRing),
      }
    : { className: "portal-timeline__item-link block" };

  return (
    <Wrapper {...wrapperProps}>
      <article
        className={cn(
          "portal-timeline__item",
          status && `portal-timeline__item--${status}`,
          isActive && "portal-timeline__item--current",
          staggerIndex > 0 && `portal-timeline__item--stagger-${Math.min(staggerIndex, 6)}`
        )}
        aria-labelledby={titleId}
        aria-current={isActive ? "step" : undefined}
        style={accentStyle}
      >
        <div className="portal-timeline__marker-wrap">
          <span className="portal-timeline__marker" aria-hidden>
            {item.icon ? (
              <BlockIcon name={item.icon} size={iconSizes.sm} strokeWidth={2} />
            ) : (
              <span className="portal-timeline__step-number">{item.step}</span>
            )}
          </span>
          {statusLabel ? (
            <span className="sr-only">{statusLabel}</span>
          ) : null}
        </div>

        <div className="portal-timeline__content">
          {showDate && item.date ? (
            <time className="portal-timeline__date text-caption text-secondary" dateTime={item.date}>
              {item.date}
            </time>
          ) : null}
          <h3 id={titleId} className="portal-timeline__title text-heading text-foreground">
            {item.title}
          </h3>
          {item.description ? (
            <p className="portal-timeline__description mt-2 text-body text-muted">
              {item.description}
            </p>
          ) : null}
        </div>
      </article>
    </Wrapper>
  );
}
