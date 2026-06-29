import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { iconSizes } from "@/design";
import type { EventItem } from "@/types/content";
import { PortalCard } from "./PortalCard";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={event.href} className="group block h-full">
      <PortalCard className="flex h-full flex-col overflow-hidden p-0 animate-scale-in">
        {event.image ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-background-soft">
            <Image
              src={event.image}
              alt=""
              fill
              className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-heading text-foreground group-hover:text-secondary">{event.title}</h3>
          {event.excerpt ? (
            <p className="mt-2 flex-1 text-body text-muted">{event.excerpt}</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {event.date ? (
              <li className="flex items-center gap-2 text-caption text-muted">
                <Calendar size={iconSizes.sm} strokeWidth={2} aria-hidden />
                <time>{event.date}</time>
              </li>
            ) : null}
            {event.location ? (
              <li className="flex items-center gap-2 text-caption text-muted">
                <MapPin size={iconSizes.sm} strokeWidth={2} aria-hidden />
                {event.location}
              </li>
            ) : null}
          </ul>
          <span className="mt-4 flex items-center gap-1 text-caption font-medium text-secondary group-hover:text-accent">
            Ver evento
            <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </PortalCard>
    </Link>
  );
}
