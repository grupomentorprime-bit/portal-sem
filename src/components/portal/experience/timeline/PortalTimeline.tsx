import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { asString } from "@/lib/cms/block-utils";
import type {
  PortalTimelineLayout,
  PortalTimelineProps,
  PortalTimelineVariant,
} from "@/types/timeline";
import { cn } from "@/lib/utils";
import { PortalTimelineConnector } from "./PortalTimelineConnector";
import { PortalTimelineHeader } from "./PortalTimelineHeader";
import { PortalTimelineItem } from "./PortalTimelineItem";

export function PortalTimeline({
  settings,
  items,
  id = "timeline",
  muted = false,
  footer,
}: PortalTimelineProps) {
  const layout = resolveLayout(settings.layout);
  const variant = resolveVariant(settings.variant);
  const emptyTitle = asString(settings.emptyTitle);
  const emptyDescription = asString(settings.emptyDescription);
  const title = asString(settings.title);
  const showDate = variant === "calendar" || variant === "chronology";
  const hasStatus = items.some((item) => item.status);
  const activeIndex = hasStatus ? items.findIndex((item) => item.status === "active") : -1;

  return (
    <PortalSection id={id} muted={muted}>
      <PortalContainer>
        <div
          className={cn(
            "portal-timeline animate-slide-up",
            `portal-timeline--layout-${layout}`,
            `portal-timeline--variant-${variant}`
          )}
        >
          <PortalTimelineHeader settings={settings} />

          {items.length > 0 ? (
            <ol
              className="portal-timeline__track"
              aria-label={title || "Línea de tiempo"}
            >
              {items.map((item, index) => (
                <li key={item.id} className="portal-timeline__step">
                  <PortalTimelineItem
                    item={item}
                    isActive={activeIndex >= 0 && index === activeIndex}
                    showDate={showDate || Boolean(item.date)}
                    staggerIndex={index + 1}
                  />
                  {index < items.length - 1 ? (
                    <PortalTimelineConnector orientation={layout === "vertical" ? "vertical" : "horizontal"} />
                  ) : null}
                </li>
              ))}
            </ol>
          ) : emptyTitle ? (
            <PortalEmptyState title={emptyTitle} description={emptyDescription || undefined} />
          ) : null}

          {footer}
        </div>
      </PortalContainer>
    </PortalSection>
  );
}

function resolveLayout(value: unknown): PortalTimelineLayout {
  if (value === "horizontal" || value === "vertical" || value === "auto") return value;
  return "auto";
}

function resolveVariant(value: unknown): PortalTimelineVariant {
  const variants = ["process", "chronology", "calendar", "route", "steps", "roadmap"] as const;
  if (typeof value === "string" && variants.includes(value as PortalTimelineVariant)) {
    return value as PortalTimelineVariant;
  }
  return "process";
}
