import type { PortalContactLocationView } from "@/types/contact-hub";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { iconSizes } from "@/design";

interface PortalContactLocationProps {
  location: PortalContactLocationView;
  className?: string;
}

export function PortalContactLocation({ location, className }: PortalContactLocationProps) {
  const addressLine = [location.address, location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={cn(
        "portal-contact-hub__location rounded-[var(--radius-xl)] border border-border bg-background p-6",
        location.primary && "portal-contact-hub__location--primary",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <MapPin size={iconSizes.md} className="mt-0.5 shrink-0 text-secondary" strokeWidth={1.75} aria-hidden />
        <div>
          <h3 className="text-body font-semibold text-foreground">{location.name}</h3>
          <p className="mt-1 text-body text-muted">{addressLine}</p>
          {location.hours ? (
            <p className="mt-2 text-caption text-muted">Horario: {location.hours}</p>
          ) : null}
          {location.phone ? (
            <p className="mt-1 text-caption text-muted">Tel: {location.phone}</p>
          ) : null}
          {location.email ? (
            <p className="mt-1 text-caption text-muted">{location.email}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
