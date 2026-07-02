import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import type { EventItem } from "@/types/content";
import { cn } from "@/lib/utils";
import { PortalCard } from "./PortalCard";
import { CardMedia } from "./CardMedia";

interface EventCardProps {
  event: EventItem;
  variant?: "card" | "timeline";
  ctaLabel?: string;
}

export function EventCard({ event, variant = "card", ctaLabel }: EventCardProps) {
  const timeline = variant === "timeline";

  return (
    <article className={cn("group", timeline ? "eco-events-timeline__item" : "h-full")}>
      {timeline ? <span className="eco-events-timeline__marker" aria-hidden /> : null}
      <Link href={event.href} className={cn("block", !timeline && "h-full", focusRing)}>
        <PortalCard
          className={cn(
            "eco-event-card overflow-hidden p-0",
            timeline ? "flex flex-row gap-0" : "flex h-full flex-col"
          )}
        >
          {event.image ? (
            <CardMedia
              src={event.image}
              alt={event.title}
              className={cn(timeline ? "hidden w-40 shrink-0 sm:block" : undefined)}
              sizes="160px"
            />
          ) : null}
          <div className={cn("flex flex-1 flex-col p-6", timeline && "min-w-0")}>
            <div className="mb-2 flex flex-wrap gap-3 text-caption text-muted">
              {event.date ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={iconSizes.sm} strokeWidth={2} aria-hidden />
                  <time>{event.date}</time>
                </span>
              ) : null}
              {event.time ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={iconSizes.sm} strokeWidth={2} aria-hidden />
                  {event.time}
                </span>
              ) : null}
            </div>
            <h3 className="text-heading text-foreground group-hover:text-secondary">{event.title}</h3>
            {event.location ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-muted">
                <MapPin size={iconSizes.sm} strokeWidth={2} aria-hidden />
                {event.location}
              </p>
            ) : null}
            {event.excerpt && !timeline ? (
              <p className="mt-2 flex-1 text-body text-muted line-clamp-2">{event.excerpt}</p>
            ) : null}
            {ctaLabel ?? event.ctaLabel ? (
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
                {ctaLabel ?? event.ctaLabel}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
        </PortalCard>
      </Link>
    </article>
  );
}
