import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { PortalCatalogCard, programItemToCatalogCard } from "@/components/portal/catalog";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import type { ProgramItem } from "@/types/content";

export interface ProgramsSectionSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonHref?: string;
  buttonLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorTitle?: string;
  errorDescription?: string;
}

interface ProgramsSectionContentProps {
  programs: ProgramItem[];
  settings: ProgramsSectionSettings;
  error?: boolean;
  id?: string;
  muted?: boolean;
}

export function ProgramsSectionContent({
  programs,
  settings,
  error = false,
  id = "programas-destacados",
  muted = false,
}: ProgramsSectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);
  const showFooter =
    asBoolean(settings.showButton, true) && asString(settings.buttonHref);
  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const errorTitle = asString(settings.errorTitle);
  const errorDescription = asString(settings.errorDescription);

  return (
    <PortalSection id={id} muted={muted}>
      <PortalContainer>
        {showHeader ? (
          <PortalSectionHeader
            overline={settings.overline}
            title={title}
            description={settings.description}
            href={settings.buttonHref}
            linkLabel={settings.buttonLabel}
          />
        ) : null}

        {error ? (
          errorTitle ? (
            <PortalEmptyState title={errorTitle} description={errorDescription || undefined} />
          ) : null
        ) : programs.length > 0 ? (
          <ul
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {programs.map((program) => (
              <li key={program.id} className="h-full">
                <PortalCatalogCard
                  {...programItemToCatalogCard(program)}
                  className="w-full max-w-none"
                />
              </li>
            ))}
          </ul>
        ) : empty.emptyTitle ? (
          <PortalEmptyState
            title={empty.emptyTitle}
            description={empty.emptyDescription}
            actionLabel={
              showFooter ? asString(settings.buttonLabel, empty.emptyActionLabel) : empty.emptyActionLabel
            }
            actionHref={showFooter ? asString(settings.buttonHref, empty.emptyActionHref) : empty.emptyActionHref}
          />
        ) : null}

        {showFooter && !error && programs.length > 0 ? (
          <div className="mt-12 text-center">
            <Button href={asString(settings.buttonHref)} variant="outline" size="lg">
              {asString(settings.buttonLabel)}
            </Button>
          </div>
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}
