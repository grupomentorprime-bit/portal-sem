import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import type { PortalNewsGridProps } from "@/types/news-grid";
import { PortalNewsCard } from "./PortalNewsCard";

export function PortalNewsGrid({
  settings,
  items,
  error = false,
  id = "noticias",
  muted = false,
}: PortalNewsGridProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);
  const showButton = asBoolean(settings.showButton, true);
  const buttonHref = asString(settings.buttonHref);
  const buttonLabel = asString(settings.buttonLabel);
  const cardCtaLabel = asString(settings.cardCtaLabel, asString(settings.readMoreLabel, "Leer más"));
  const showHeader = Boolean(overline || title || description);
  const showFooter = showButton && buttonHref && buttonLabel;

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
        <div className="portal-news-grid animate-slide-up">
          {showHeader ? (
            <header className="portal-news-grid__header mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                {overline ? (
                  <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
                    {overline}
                  </p>
                ) : null}
                {title ? (
                  <h2 className="mt-2 text-display-l font-semibold text-foreground">{title}</h2>
                ) : null}
                {description ? (
                  <p className="mt-4 text-body text-muted sm:text-lg">{description}</p>
                ) : null}
              </div>
              {showFooter ? (
                <Button href={buttonHref} variant="ghost" className="hidden shrink-0 lg:inline-flex">
                  {buttonLabel}
                  <span className="sr-only"> — noticias</span>
                </Button>
              ) : null}
            </header>
          ) : null}

          {error ? (
            errorTitle ? (
              <PortalEmptyState title={errorTitle} description={errorDescription || undefined} />
            ) : null
          ) : items.length > 0 ? (
            <ul className="portal-news-grid__list" role="list" aria-label={title || "Noticias"}>
              {items.map((item, index) => (
                <li key={item.id} className="h-full">
                  <PortalNewsCard
                    item={item}
                    ctaLabel={cardCtaLabel}
                    priorityImage={index === 0}
                    staggerIndex={index + 1}
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
              actionHref={
                showFooter ? asString(settings.buttonHref, empty.emptyActionHref) : empty.emptyActionHref
              }
            />
          ) : null}

          {showFooter && !error && items.length > 0 ? (
            <div className="mt-12 text-center lg:hidden">
              <Button href={buttonHref} variant="outline" size="lg">
                {buttonLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
