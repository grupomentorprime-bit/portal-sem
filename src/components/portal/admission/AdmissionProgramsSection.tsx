import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { ProgramsShowcaseExperience } from "@/components/experience/programs-showcase";
import type { AdmissionProgramsSectionConfig } from "@/types/admission";
import type { ProgramItem } from "@/types/content";

interface AdmissionProgramsSectionProps {
  config: AdmissionProgramsSectionConfig;
  programs: ProgramItem[];
  sectionId?: string;
}

export function AdmissionProgramsSection({
  config,
  programs,
  sectionId = "programas-admision",
}: AdmissionProgramsSectionProps) {
  if (!config.enabled || programs.length === 0) return null;

  return (
    <PortalSection
      id={sectionId}
      className="admission-programs-section border-b border-border"
      muted
    >
      <PortalContainer size="lg" className="admission-programs-section__inner">
        <ProgramsShowcaseExperience
          config={config}
          programs={programs}
          className="admission-programs-section__showcase"
        />
      </PortalContainer>
    </PortalSection>
  );
}

/** @deprecated Usar AdmissionProgramsSection */
export const AdmissionHeroProgramsSection = AdmissionProgramsSection;
