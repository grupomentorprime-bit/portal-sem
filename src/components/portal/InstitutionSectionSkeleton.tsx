import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { CardGridSkeleton } from "@/components/portal/cards/CardSkeleton";

export function InstitutionSectionSkeleton() {
  return (
    <>
      <PortalSection id="por-que-estudiar" aria-busy="true">
        <PortalContainer>
          <div className="mb-12 space-y-3" aria-hidden>
            <div className="h-4 w-24 animate-pulse rounded bg-background-soft" />
            <div className="h-8 w-80 max-w-full animate-pulse rounded bg-background-soft" />
          </div>
          <CardGridSkeleton count={4} />
        </PortalContainer>
      </PortalSection>
      <PortalSection muted id="modalidad-skeleton" aria-hidden>
        <PortalContainer>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-8 w-64 animate-pulse rounded bg-background-soft" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-[var(--radius-xl)] bg-background-soft" />
              ))}
            </div>
            <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-2xl)] bg-background-soft" />
          </div>
        </PortalContainer>
      </PortalSection>
    </>
  );
}
