"use client";

import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { ProgramsPremiumSection } from "@/components/portal/programs/ProgramsPremiumSection";
import { DEFAULT_PROGRAMS_PAGE_PREMIUM } from "@/lib/portal/program-premium-config";
import type { ProgramItem } from "@/types/content";

interface ProgramsPageContentProps {
  programs: ProgramItem[];
}

export function ProgramsPageContent({ programs }: ProgramsPageContentProps) {
  const defaults = DEFAULT_PROGRAMS_PAGE_PREMIUM;

  return (
    <PortalSection padding="md">
      <PortalContainer>
        {programs.length > 0 ? (
          <ProgramsPremiumSection
            programs={programs}
            overline={defaults.overline}
            title={defaults.title}
            description={defaults.description}
            cardCtaLabel={defaults.cardCtaLabel}
            pageSize={defaults.pageSize}
            showPagination
            showHelpCta={defaults.showHelpCta}
            helpCta={defaults.help}
            layout="page"
          />
        ) : (
          <PortalEmptyState
            title="Sin programas publicados"
            description="Los programas académicos se gestionan desde el panel de administración."
          />
        )}
      </PortalContainer>
    </PortalSection>
  );
}
