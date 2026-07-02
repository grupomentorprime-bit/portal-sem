import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { CardGridSkeleton } from "@/components/portal/cards/CardSkeleton";

export function ProgramsSectionSkeleton() {
  return (
    <PortalSection id="programas-destacados">
      <PortalContainer>
        <div aria-busy="true" aria-label="Cargando programas">
          <div className="mb-12 space-y-3" aria-hidden>
            <div className="h-4 w-24 animate-pulse rounded bg-background-soft" />
            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-background-soft" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-background-soft" />
          </div>
          <CardGridSkeleton count={3} />
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
