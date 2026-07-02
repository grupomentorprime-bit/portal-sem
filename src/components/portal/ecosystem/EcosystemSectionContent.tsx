import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { EventCard, LibraryCard, ResourceCard } from "@/components/portal/cards";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings, type ResourceItem } from "@/lib/portal/blocks";
import type { EventItem, LibraryItem } from "@/types/content";

export { NewsSectionContent } from "@/components/portal/ecosystem/NewsSectionContent";

export interface EcosystemSectionSettings extends Record<string, unknown> {
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
  readMoreLabel?: string;
  viewEventLabel?: string;
  cardCtaLabel?: string;
}

interface EventsSectionContentProps {
  items: EventItem[];
  settings: EcosystemSectionSettings;
  error?: boolean;
  id?: string;
}

export function EventsSectionContent({
  items,
  settings,
  error = false,
  id = "eventos",
}: EventsSectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);
  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const viewEventLabel = asString(settings.viewEventLabel);
  const errorTitle = asString(settings.errorTitle);
  const errorDescription = asString(settings.errorDescription);

  if (!showHeader && items.length === 0 && !error) return null;

  return (
    <PortalSection muted id={id}>
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
        ) : items.length > 0 ? (
          <>
            <ul className="eco-events-timeline hidden lg:block" role="list">
              {items.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} variant="timeline" ctaLabel={viewEventLabel || undefined} />
                </li>
              ))}
            </ul>
            <ul className="grid gap-8 lg:hidden" role="list">
              {items.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} variant="card" ctaLabel={viewEventLabel || undefined} />
                </li>
              ))}
            </ul>
          </>
        ) : empty.emptyTitle ? (
          <PortalEmptyState
            title={empty.emptyTitle}
            description={empty.emptyDescription}
            actionLabel={empty.emptyActionLabel}
            actionHref={empty.emptyActionHref}
          />
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}

interface LibrarySectionContentProps {
  items: LibraryItem[];
  settings: EcosystemSectionSettings;
  error?: boolean;
  id?: string;
}

export function LibrarySectionContent({
  items,
  settings,
  error = false,
  id = "biblioteca",
}: LibrarySectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);
  const showFooter = asBoolean(settings.showButton, false) && asString(settings.buttonHref);
  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const cardCtaLabel = asString(settings.cardCtaLabel);
  const errorTitle = asString(settings.errorTitle);
  const errorDescription = asString(settings.errorDescription);

  if (!showHeader && items.length === 0 && !error) return null;

  return (
    <PortalSection id={id}>
      <PortalContainer>
        {showHeader ? (
          <PortalSectionHeader
            overline={settings.overline}
            title={title}
            description={settings.description}
            href={showFooter ? settings.buttonHref : undefined}
            linkLabel={settings.buttonLabel}
          />
        ) : null}

        {error ? (
          errorTitle ? (
            <PortalEmptyState title={errorTitle} description={errorDescription || undefined} />
          ) : null
        ) : items.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {items.map((item) => (
              <li key={item.id} className="h-full">
                <LibraryCard item={item} ctaLabel={cardCtaLabel || undefined} />
              </li>
            ))}
          </ul>
        ) : empty.emptyTitle ? (
          <PortalEmptyState
            title={empty.emptyTitle}
            description={empty.emptyDescription}
            actionLabel={empty.emptyActionLabel}
            actionHref={empty.emptyActionHref}
          />
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}

interface ResourcesSectionContentProps {
  items: ResourceItem[];
  settings: EcosystemSectionSettings;
  id?: string;
}

export function ResourcesSectionContent({
  items,
  settings,
  id = "recursos-destacados",
}: ResourcesSectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);

  if (!showHeader && items.length === 0) return null;

  return (
    <PortalSection muted id={id}>
      <PortalContainer>
        {showHeader ? (
          <PortalSectionHeader
            overline={settings.overline}
            title={title}
            description={settings.description}
          />
        ) : null}

        {items.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {items.map((item) => (
              <li key={item.id} className="h-full">
                <ResourceCard
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  resourceType={item.resourceType}
                  icon={item.icon}
                  image={item.image}
                  ctaLabel={item.ctaLabel}
                />
              </li>
            ))}
          </ul>
        ) : (
          <PortalEmptyState
            title="Material formativo en preparación"
            description="El material formativo destacado se publicará desde el panel de administración."
          />
        )}
      </PortalContainer>
    </PortalSection>
  );
}
