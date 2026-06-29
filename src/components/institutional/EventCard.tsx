import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { iconSizes } from "@/design";
import type { EventItem } from "@/lib/institutional/home-content";
import { InstitutionalCard } from "./InstitutionalCard";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={event.href} className="group block">
      <InstitutionalCard className="animate-scale-in">
        <h3 className="text-heading text-foreground group-hover:text-secondary">
          {event.title}
        </h3>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-caption text-muted">
            <Calendar size={iconSizes.sm} strokeWidth={2} aria-hidden />
            <time>{event.date}</time>
          </li>
          <li className="flex items-center gap-2 text-caption text-muted">
            <MapPin size={iconSizes.sm} strokeWidth={2} aria-hidden />
            {event.location}
          </li>
        </ul>
      </InstitutionalCard>
    </Link>
  );
}
