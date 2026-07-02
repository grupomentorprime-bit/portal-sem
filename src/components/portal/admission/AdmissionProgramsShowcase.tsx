"use client";

import { ProgramsShowcaseExperience } from "@/components/experience/programs-showcase";
import type { AdmissionProgramsSectionConfig } from "@/types/admission";
import type { ProgramItem } from "@/types/content";

/** @deprecated Usar ProgramsShowcaseExperience directamente */
interface AdmissionProgramsShowcaseProps {
  config: AdmissionProgramsSectionConfig;
  programs: ProgramItem[];
  className?: string;
}

/** @deprecated Usar ProgramsShowcaseExperience */
export function AdmissionProgramsShowcase({
  config,
  programs,
  className,
}: AdmissionProgramsShowcaseProps) {
  return (
    <ProgramsShowcaseExperience config={config} programs={programs} className={className} />
  );
}
