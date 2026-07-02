import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { AcademicAgendaCard } from "@/components/portal/cards";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import type { AcademicAgendaItem } from "@/types/content";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface AcademicAgendaSectionContentProps {
  items: AcademicAgendaItem[];
  settings: EcosystemSectionSettings;
  error?: boolean;
  id?: string;
}

export function AcademicAgendaSectionContent({
  items,
  settings,
  error = false,
  id = "agenda-academica",
}: AcademicAgendaSectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);
  const showFooter = asBoolean(settings.showButton, true) && asString(settings.buttonHref);
  const featured = items.find((i) => i.featured) ?? items[0];
  const upcoming = items.filter((i) => i.id !== featured?.id);
  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const viewLabel = asString(settings.viewEventLabel) || "Ver detalle";
  const errorTitle = asString(settings.errorTitle);
  const errorDescription = asString(settings.errorDescription);

  return (
    <PortalSection id={id}>
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
        ) : featured ? (
          <div className="eco-agenda-layout">
            <AcademicAgendaCard item={featured} variant="featured" ctaLabel={viewLabel} />
            {upcoming.length > 0 ? (
              <ul className="eco-events-timeline" role="list">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <AcademicAgendaCard item={item} variant="timeline" ctaLabel={viewLabel} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <PortalEmptyState
            title={empty.emptyTitle}
            description={empty.emptyDescription}
            actionLabel={empty.emptyActionLabel}
            actionHref={empty.emptyActionHref}
          />
        )}

        {showFooter && items.length > 0 ? (
          <div className="mt-8 text-center">
            <Button href={asString(settings.buttonHref)} variant="secondary">
              {asString(settings.buttonLabel)}
            </Button>
          </div>
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}
