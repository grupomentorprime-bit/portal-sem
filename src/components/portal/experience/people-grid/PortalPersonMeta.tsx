import { cn } from "@/lib/utils";

interface PortalPersonMetaProps {
  name: string;
  position?: string;
  specialty?: string;
  featured?: boolean;
  personStatus?: string;
  nameId?: string;
  className?: string;
}

function statusLabel(personStatus?: string, featured?: boolean): string | null {
  if (personStatus === "guest") return "Invitado";
  if (personStatus === "featured" || featured) return "Destacado";
  return null;
}

export function PortalPersonMeta({
  name,
  position,
  specialty,
  featured,
  personStatus,
  nameId,
  className,
}: PortalPersonMetaProps) {
  const badge = statusLabel(personStatus, featured);

  return (
    <div className={cn("portal-person-card__meta", className)}>
      {badge ? (
        <span className="portal-person-card__badge mb-2 inline-flex">{badge}</span>
      ) : null}
      <h3 id={nameId} className="portal-person-card__name text-heading text-foreground">
        {name}
      </h3>
      {position ? (
        <p className="portal-person-card__position mt-1 text-caption font-semibold uppercase tracking-wide text-secondary">
          {position}
        </p>
      ) : null}
      {specialty ? (
        <p className="portal-person-card__specialty mt-2 text-body text-muted">{specialty}</p>
      ) : null}
    </div>
  );
}
