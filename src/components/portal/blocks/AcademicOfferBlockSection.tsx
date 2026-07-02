import "server-only";

import { PortalProgramsSection } from "@/components/portal/programs";
import type { PortalProgramsSectionSettings } from "@/components/portal/programs";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { DEFAULT_SETTINGS } from "@/lib/cms/page-defaults";
import { blockSettings } from "@/lib/portal/blocks";
import {
  mergeHomeAcademicOfferSettings,
  withHomeDemoPrograms,
} from "@/lib/portal/institutional-demo";
import { withProgramImageFallbacks } from "@/lib/portal/program-image-fallbacks";
import type { ProgramItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface AcademicOfferBlockSectionProps {
  tenant: string;
  block: PageBlock;
  pageSlug?: string;
}

export async function AcademicOfferBlockSection({
  tenant,
  block,
  pageSlug,
}: AcademicOfferBlockSectionProps) {
  const settings = mergeHomeAcademicOfferSettings(
    blockSettings<PortalProgramsSectionSettings>(block),
    pageSlug
  );

  let programs: ProgramItem[] = [];
  let error = false;

  try {
    const items = await resolveBlockContent(block, tenant);
    const limit = getQueryLimit(block.settings, 4);
    programs = (items as ProgramItem[]).slice(0, limit);
  } catch {
    error = true;
  }

  programs = withHomeDemoPrograms(programs, pageSlug);
  programs = withProgramImageFallbacks(programs);

  return (
    <PortalProgramsSection
      programs={programs}
      settings={settings}
      error={error}
      id="oferta-academica"
    />
  );
}

/** Bloque por defecto para vistas sin CMS */
export function createFallbackAcademicOfferBlock(): PageBlock {
  return {
    id: "academic-offer-fallback",
    type: "academic_offer",
    visible: true,
    order: 0,
    settings: { ...DEFAULT_SETTINGS.academic_offer },
  };
}
