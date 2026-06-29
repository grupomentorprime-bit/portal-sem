import { AcademicEcosystemSectionSkeleton } from "@/components/portal/AcademicEcosystemSectionSkeleton";
import { InstitutionSectionSkeleton } from "@/components/portal/InstitutionSectionSkeleton";
import { ProgramsSectionSkeleton } from "@/components/portal/ProgramsSectionSkeleton";
import { CardGridSkeleton } from "@/components/portal/cards/CardSkeleton";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import type { BlockType } from "@/types/page";

interface PortalBlockSkeletonProps {
  type: BlockType;
}

function GenericSectionSkeleton({ id }: { id?: string }) {
  return (
    <PortalSection id={id} aria-busy="true">
      <PortalContainer>
        <div className="mb-12 space-y-3" aria-hidden>
          <div className="h-3 w-24 rounded bg-border" />
          <div className="h-8 w-2/3 max-w-md rounded bg-border" />
          <div className="h-4 w-full max-w-lg rounded bg-border" />
        </div>
        <CardGridSkeleton count={3} />
      </PortalContainer>
    </PortalSection>
  );
}

export function PortalBlockSkeleton({ type }: PortalBlockSkeletonProps) {
  switch (type) {
    case "hero":
      return (
        <div className="portal-hero-premium bg-primary" aria-busy="true">
          <PortalContainer className="py-24">
            <div className="h-12 w-2/3 max-w-xl rounded bg-text-inverse/10" aria-hidden />
            <div className="mt-4 h-6 w-1/2 max-w-md rounded bg-text-inverse/10" aria-hidden />
          </PortalContainer>
        </div>
      );
    case "programs":
      return <ProgramsSectionSkeleton />;
    case "presentation":
    case "modality":
    case "stats":
    case "gallery":
    case "testimonials":
    case "verse":
      return <InstitutionSectionSkeleton />;
    case "news":
    case "events":
    case "library":
    case "resources":
      return <AcademicEcosystemSectionSkeleton />;
    case "admission_process":
    case "scholarships":
    case "faq":
    case "quick_contact":
    case "cta":
    case "alliance":
    case "teachers":
      return <GenericSectionSkeleton />;
    default:
      return <GenericSectionSkeleton />;
  }
}
