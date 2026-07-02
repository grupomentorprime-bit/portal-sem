import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { CardGridSkeleton } from "@/components/portal/cards/CardSkeleton";

export function AcademicEcosystemSectionSkeleton() {
  return (
    <>
      <PortalSection id="noticias" aria-busy="true">
        <PortalContainer>
          <div className="mb-12 space-y-3" aria-hidden>
            <div className="h-4 w-24 animate-pulse rounded bg-background-soft" />
            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-background-soft" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-[16/10] animate-pulse rounded-[var(--radius-xl)] bg-background-soft" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-[var(--radius-xl)] bg-background-soft" />
              ))}
            </div>
          </div>
        </PortalContainer>
      </PortalSection>
      <PortalSection muted aria-hidden>
        <PortalContainer>
          <CardGridSkeleton count={4} />
        </PortalContainer>
      </PortalSection>
    </>
  );
}
