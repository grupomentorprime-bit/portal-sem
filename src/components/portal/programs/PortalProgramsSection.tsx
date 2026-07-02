import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { ProgramsPremiumSection } from "@/components/portal/programs/ProgramsPremiumSection";
import { asBoolean, asNumber, asString } from "@/lib/cms/block-utils";
import {
  DEFAULT_PROGRAMS_HELP_CTA,
  DEFAULT_PROGRAMS_HOME_PREMIUM,
} from "@/lib/portal/program-premium-config";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import type { ProgramItem } from "@/types/content";

export interface PortalProgramsSectionSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonHref?: string;
  buttonLabel?: string;
  cardCtaLabel?: string;
  pageSize?: number;
  showPagination?: boolean;
  showHelpCta?: boolean;
  helpTitle?: string;
  helpDescription?: string;
  helpPrimaryLabel?: string;
  helpPrimaryHref?: string;
  helpSecondaryLabel?: string;
  helpSecondaryHref?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorTitle?: string;
  errorDescription?: string;
}

interface PortalProgramsSectionProps {
  programs: ProgramItem[];
  settings: PortalProgramsSectionSettings;
  error?: boolean;
  id?: string;
}

export function PortalProgramsSection({
  programs,
  settings,
  error = false,
  id = "oferta-academica",
}: PortalProgramsSectionProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);
  const cardCtaLabel = asString(settings.cardCtaLabel, "Conocer programa");
  const pageSize = asNumber(settings.pageSize, DEFAULT_PROGRAMS_HOME_PREMIUM.pageSize);
  const showPagination = asBoolean(
    settings.showPagination,
    DEFAULT_PROGRAMS_HOME_PREMIUM.showPagination
  );
  const showHelpCta = asBoolean(settings.showHelpCta, DEFAULT_PROGRAMS_HOME_PREMIUM.showHelpCta);

  const helpCta = {
    title: asString(settings.helpTitle, DEFAULT_PROGRAMS_HELP_CTA.title),
    description: asString(settings.helpDescription, DEFAULT_PROGRAMS_HELP_CTA.description),
    primaryLabel: asString(settings.helpPrimaryLabel, DEFAULT_PROGRAMS_HELP_CTA.primaryLabel),
    primaryHref: asString(settings.helpPrimaryHref, DEFAULT_PROGRAMS_HELP_CTA.primaryHref),
    secondaryLabel: asString(settings.helpSecondaryLabel, DEFAULT_PROGRAMS_HELP_CTA.secondaryLabel),
    secondaryHref: asString(settings.helpSecondaryHref, DEFAULT_PROGRAMS_HELP_CTA.secondaryHref),
  };

  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const errorTitle = asString(settings.errorTitle);
  const errorDescription = asString(settings.errorDescription);

  return (
    <PortalSection id={id}>
      <PortalContainer className="container-f">
        <div className="section-f portal-programs-section portal-programs-section--premium-v4 animate-slide-up">
          {error ? (
            errorTitle ? (
              <PortalEmptyState
                title={errorTitle}
                description={errorDescription || undefined}
              />
            ) : null
          ) : programs.length > 0 ? (
            <ProgramsPremiumSection
              programs={programs}
              overline={overline || undefined}
              title={title || undefined}
              description={description || undefined}
              cardCtaLabel={cardCtaLabel}
              pageSize={pageSize}
              showPagination={showPagination}
              showHelpCta={showHelpCta}
              helpCta={helpCta}
              layout="home"
            />
          ) : empty.emptyTitle ? (
            <PortalEmptyState
              title={empty.emptyTitle}
              description={empty.emptyDescription}
              actionLabel={empty.emptyActionLabel}
              actionHref={empty.emptyActionHref}
            />
          ) : null}
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
