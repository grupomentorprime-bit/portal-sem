import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import type { AcademicAgendaItem } from "@/types/content";
import { cn } from "@/lib/utils";
import { PortalCard } from "./PortalCard";
import { CardMedia } from "./CardMedia";

interface AcademicAgendaCardProps {
  item: AcademicAgendaItem;
  variant?: "card" | "featured" | "timeline";
  ctaLabel?: string;
}

export function AcademicAgendaCard({
  item,
  variant = "card",
  ctaLabel,
}: AcademicAgendaCardProps) {
  const featured = variant === "featured";
  const timeline = variant === "timeline";
  const accent = item.color || "var(--color-secondary)";

  return (
    <article
      className={cn("group", timeline ? "eco-events-timeline__item" : "h-full")}
      style={featured ? ({ "--agenda-accent": accent } as CSSProperties) : undefined}
    >
      {timeline ? <span className="eco-events-timeline__marker" aria-hidden /> : null}
      <Link href={item.href} className={cn("block", !timeline && "h-full", focusRing)}>
        <PortalCard
          className={cn(
            "eco-event-card overflow-hidden p-0",
            featured && "eco-agenda-featured border-l-4",
            timeline ? "flex flex-row gap-0" : "flex h-full flex-col"
          )}
          style={
            featured
              ? { borderLeftColor: accent }
              : timeline
                ? undefined
                : { borderTopWidth: 3, borderTopColor: accent }
          }
        >
          {item.image ? (
            <CardMedia
              src={item.image}
              alt={item.title}
              className={cn(timeline ? "hidden w-40 shrink-0 sm:block" : undefined)}
              sizes="160px"
            />
          ) : null}
          <div className={cn("flex flex-1 flex-col p-6", timeline && "min-w-0")}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {item.categoryLabel ? (
                <span
                  className="rounded-full px-2.5 py-0.5 text-caption font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  {item.categoryLabel}
                </span>
              ) : null}
              {item.startDateLabel ? (
                <span className="inline-flex items-center gap-1.5 text-caption text-muted">
                  <Calendar size={iconSizes.sm} strokeWidth={2} aria-hidden />
                  <time dateTime={item.startDate}>
                    {item.startDateLabel}
                    {item.endDateLabel ? ` — ${item.endDateLabel}` : ""}
                  </time>
                </span>
              ) : null}
            </div>
            <h3 className="text-heading text-foreground group-hover:text-secondary">{item.title}</h3>
            {item.description && !timeline ? (
              <p className="mt-2 flex-1 text-body text-muted line-clamp-2">{item.description}</p>
            ) : null}
            {ctaLabel ?? item.ctaLabel ? (
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
                {ctaLabel ?? item.ctaLabel}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}
