import { cn } from "@/lib/utils";

interface PortalContactSkeletonProps {
  showMap?: boolean;
  channelCount?: number;
  className?: string;
}

export function PortalContactSkeleton({
  showMap = true,
  channelCount = 4,
  className,
}: PortalContactSkeletonProps) {
  return (
    <div
      className={cn("portal-contact-hub portal-contact-hub--skeleton", className)}
      aria-busy="true"
      aria-label="Cargando contacto"
    >
      <div className="portal-contact-hub__layout">
        <div className="portal-contact-hub__main space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-border" />
            <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-border" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-border" />
          </div>
          <ul className="portal-contact-hub__channels" role="presentation">
            {Array.from({ length: channelCount }).map((_, i) => (
              <li key={i}>
                <div className="portal-contact-hub__channel h-32 animate-pulse rounded-[var(--radius-xl)] bg-background-muted" />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <div className="h-12 w-40 animate-pulse rounded-[var(--radius-md)] bg-border" />
            <div className="h-12 w-44 animate-pulse rounded-[var(--radius-md)] bg-border" />
          </div>
        </div>
        {showMap ? (
          <div className="portal-contact-hub__aside">
            <div className="portal-contact-hub__map-frame aspect-[16/10] animate-pulse rounded-[var(--radius-xl)] bg-background-muted" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
