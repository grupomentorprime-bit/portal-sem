import { AcademicEcosystemSectionSkeleton } from "@/components/portal/AcademicEcosystemSectionSkeleton";
import { InstitutionSectionSkeleton } from "@/components/portal/InstitutionSectionSkeleton";
import { ProgramsSectionSkeleton } from "@/components/portal/ProgramsSectionSkeleton";
import { PortalProgramsSectionSkeleton } from "@/components/portal/PortalProgramsSectionSkeleton";
import { PortalFeatureGridSkeleton } from "@/components/portal/experience/feature-grid";
import { PortalNewsSkeleton } from "@/components/portal/experience/news-grid";
import { PortalPeopleSkeleton } from "@/components/portal/experience/people-grid";
import { PortalContactSkeleton } from "@/components/portal/experience/contact-hub";
import { PortalFormSkeleton } from "@/components/portal/experience/forms";
import { PortalFooterSkeleton } from "@/components/portal/experience/footer-premium";
import { PortalCTASkeleton } from "@/components/portal/experience/cta-premium";
import { PortalTimelineSkeleton } from "@/components/portal/experience/timeline";
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
    case "academic_offer":
      return <PortalProgramsSectionSkeleton />;
    case "presentation":
    case "feature_grid":
      return (
        <PortalSection id="feature-grid" aria-busy="true">
          <PortalContainer>
            <PortalFeatureGridSkeleton count={4} />
          </PortalContainer>
        </PortalSection>
      );
    case "modality":
    case "stats":
    case "gallery":
    case "testimonials":
    case "verse":
      return <InstitutionSectionSkeleton />;
    case "news":
      return (
        <PortalSection id="noticias" aria-busy="true">
          <PortalContainer>
            <PortalNewsSkeleton count={3} />
          </PortalContainer>
        </PortalSection>
      );
    case "events":
    case "library":
    case "resources":
      return <AcademicEcosystemSectionSkeleton />;
    case "admission_process":
    case "timeline":
      return (
        <PortalSection id="timeline" aria-busy="true">
          <PortalContainer>
            <PortalTimelineSkeleton count={4} />
          </PortalContainer>
        </PortalSection>
      );
    case "contact_hub":
      return (
        <PortalSection id="contacto" aria-busy="true">
          <PortalContainer>
            <PortalContactSkeleton />
          </PortalContainer>
        </PortalSection>
      );
    case "experience_form":
      return (
        <PortalSection id="formulario" aria-busy="true">
          <PortalContainer size="md">
            <PortalFormSkeleton />
          </PortalContainer>
        </PortalSection>
      );
    case "footer_premium":
      return <PortalFooterSkeleton />;
    case "scholarships":
    case "faq":
    case "quick_contact":
    case "cta":
    case "cta_premium":
      return (
        <PortalSection id="cta-premium" aria-busy="true">
          <PortalContainer>
            <PortalCTASkeleton variant="highlight" />
          </PortalContainer>
        </PortalSection>
      );
    case "alliance":
      return <GenericSectionSkeleton />;
    case "teachers":
    case "people":
      return (
        <PortalSection id="personas" aria-busy="true">
          <PortalContainer>
            <PortalPeopleSkeleton count={4} />
          </PortalContainer>
        </PortalSection>
      );
    default:
      return <GenericSectionSkeleton />;
  }
}
