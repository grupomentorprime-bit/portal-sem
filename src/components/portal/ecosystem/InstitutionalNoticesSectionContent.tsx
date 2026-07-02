import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { InstitutionalNoticeCard } from "@/components/portal/cards";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import type { InstitutionalNoticeItem } from "@/types/content";
import type { EcosystemSectionSettings } from "@/components/portal/ecosystem/EcosystemSectionContent";

interface InstitutionalNoticesSectionContentProps {
  items: InstitutionalNoticeItem[];
  settings: EcosystemSectionSettings;
  error?: boolean;
  id?: string;
}

export function InstitutionalNoticesSectionContent({
  items,
  settings,
  error = false,
  id = "avisos",
}: InstitutionalNoticesSectionContentProps) {
  const title = asString(settings.title);
  const showHeader = Boolean(title);
  const showFooter = asBoolean(settings.showButton, true) && asString(settings.buttonHref);
  const banner = items.find((n) => n.featured);
  const gridItems = banner ? items.filter((n) => n.id !== banner.id) : items;
  const empty = emptyStateFromSettings(settings, {
    emptyTitle: asString(settings.emptyTitle),
    emptyDescription: asString(settings.emptyDescription),
    emptyActionLabel: asString(settings.emptyActionLabel),
    emptyActionHref: asString(settings.emptyActionHref),
  });
  const readMoreLabel = asString(settings.readMoreLabel) || "Leer aviso";
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
        ) : items.length > 0 ? (
          <div className="space-y-6">
            {banner ? (
              <InstitutionalNoticeCard notice={banner} variant="banner" ctaLabel={readMoreLabel} />
            ) : null}
            {gridItems.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridItems.map((notice) => (
                  <InstitutionalNoticeCard
                    key={notice.id}
                    notice={notice}
                    variant={notice.featured ? "featured" : "card"}
                    ctaLabel={readMoreLabel}
                  />
                ))}
              </div>
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
