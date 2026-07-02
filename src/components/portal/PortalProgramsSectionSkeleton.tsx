import { PortalContainer, PortalSection } from "@/components/portal/layout";

export function PortalProgramsSectionSkeleton() {
  return (
    <PortalSection id="oferta-academica">
      <PortalContainer>
        <div
          className="portal-programs-section portal-programs-section--premium-v3"
          aria-busy="true"
          aria-label="Cargando oferta académica"
        >
          <div className="featured-programs featured-programs--skeleton" aria-hidden>
            <div className="featured-programs-hero">
              <div className="featured-programs-hero__intro">
                <div className="h-4 w-40 animate-pulse rounded bg-background-soft" />
                <div className="mt-4 h-12 w-full max-w-md animate-pulse rounded bg-background-soft" />
                <div className="mt-4 h-5 w-full max-w-sm animate-pulse rounded bg-background-soft" />
                <div className="mt-8 h-11 w-52 animate-pulse rounded-full bg-background-soft" />
              </div>
              <div className="featured-programs-hero__visual">
                <div className="program-gallery__frame animate-pulse bg-background-soft" />
              </div>
            </div>
            <div className="featured-programs__stack">
              <div className="featured-program-card__surface h-48 animate-pulse rounded-[1rem] bg-background-soft" />
              <ul className="featured-programs__secondary">
                <li className="featured-programs__secondary-item">
                  <div className="program-mini-card__surface h-36 animate-pulse rounded-[1rem] bg-background-soft" />
                </li>
                <li className="featured-programs__secondary-item">
                  <div className="program-mini-card__surface h-36 animate-pulse rounded-[1rem] bg-background-soft" />
                </li>
              </ul>
            </div>
            <div className="program-trust-bar h-24 animate-pulse rounded-[1rem] bg-background-soft" />
          </div>
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
