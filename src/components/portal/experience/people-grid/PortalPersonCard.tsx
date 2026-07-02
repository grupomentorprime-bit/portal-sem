import { Button } from "@/components/ui";
import { PortalCard } from "@/components/portal/cards/PortalCard";
import type { PortalPersonCardData } from "@/types/people-grid";
import { cn } from "@/lib/utils";
import { PortalPersonImage } from "./PortalPersonImage";
import { PortalPersonMeta } from "./PortalPersonMeta";
import { PortalPersonSocial } from "./PortalPersonSocial";

interface PortalPersonCardProps {
  person: PortalPersonCardData;
  ctaLabel?: string;
  priorityImage?: boolean;
  staggerIndex?: number;
  compact?: boolean;
  className?: string;
}

export function PortalPersonCard({
  person,
  ctaLabel = "Conocer más",
  priorityImage = false,
  staggerIndex = 0,
  compact = false,
  className,
}: PortalPersonCardProps) {
  const nameId = `person-card-${person.id}-name`;
  const showBio = !compact && Boolean(person.bio?.trim());
  const showSocial = !compact;
  const showCta = !compact && Boolean(person.href?.trim());

  return (
    <article
      className={cn(
        "portal-person-card group h-full",
        staggerIndex > 0 && `portal-person-card--stagger-${Math.min(staggerIndex, 6)}`,
        compact && "portal-person-card--compact",
        className
      )}
      aria-labelledby={nameId}
      data-cursor="card"
    >
      <PortalCard className="portal-person-card__card flex h-full flex-col overflow-hidden p-0 text-center">
        <PortalPersonImage
          src={person.image}
          alt={person.name}
          priority={priorityImage}
        />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <PortalPersonMeta
            name={person.name}
            position={person.position}
            specialty={person.specialty}
            featured={person.featured}
            personStatus={person.personStatus}
            nameId={nameId}
          />
          {showBio ? (
            <p className="portal-person-card__bio mt-4 flex-1 text-left text-body text-muted line-clamp-4">
              {person.bio}
            </p>
          ) : (
            <div className="flex-1" />
          )}
          {showSocial ? (
            <PortalPersonSocial
              email={person.email}
              phone={person.phone}
              linkedin={person.linkedin}
              facebook={person.facebook}
              instagram={person.instagram}
              name={person.name}
              className="mt-4 justify-center"
            />
          ) : null}
          {showCta ? (
            <div className={cn("mt-5", showBio || showSocial ? "border-t border-border pt-4" : "")}>
              <Button href={person.href} variant="outline" size="sm" className="w-full sm:w-auto">
                {ctaLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </PortalCard>
    </article>
  );
}
