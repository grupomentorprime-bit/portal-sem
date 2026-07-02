import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { asBoolean, asString } from "@/lib/cms/block-utils";
import { emptyStateFromSettings } from "@/lib/portal/blocks";
import { cn } from "@/lib/utils";
import type { PortalPeopleGridProps } from "@/types/people-grid";
import { PortalPersonCard } from "./PortalPersonCard";

export function PortalPeopleGrid({
  settings,
  people,
  error = false,
  id = "personas",
  muted = false,
  compactCards = false,
  editorialHome = false,
}: PortalPeopleGridProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);
  const showButton = asBoolean(settings.showButton, true);
  const buttonHref = asString(settings.buttonHref);
  const buttonLabel = asString(settings.buttonLabel);
  const cardCtaLabel = asString(settings.cardCtaLabel, "Conocer más");
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
        <div
          className={cn(
            "portal-people-grid animate-slide-up",
            editorialHome && "portal-people-grid--home-editorial"
          )}
        >
          {showHeader ? (
            <header
              className={cn(
                "portal-people-grid__header flex flex-col gap-4",
                !editorialHome && "mb-12 sm:flex-row sm:items-end sm:justify-between"
              )}
            >
              <div className={cn("max-w-3xl", editorialHome && "mx-auto text-center")}>
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
              {showFooter && !editorialHome ? (
                <Button href={buttonHref} variant="ghost" className="hidden shrink-0 lg:inline-flex">
                  {buttonLabel}
                  <span className="sr-only"> — personas</span>
                </Button>
              ) : null}
            </header>
          ) : null}

          {error ? (
            errorTitle ? (
              <PortalEmptyState title={errorTitle} description={errorDescription || undefined} />
            ) : null
          ) : people.length > 0 ? (
            <ul className="portal-people-grid__list" role="list" aria-label={title || "Personas"}>
              {people.map((person, index) => (
                <li key={person.id} className="h-full">
                  <PortalPersonCard
                    person={person}
                    ctaLabel={cardCtaLabel}
                    priorityImage={index < 2}
                    staggerIndex={index + 1}
                    compact={compactCards}
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

          {showFooter && !error && people.length > 0 ? (
            <div
              className={cn(
                "mt-12 text-center",
                editorialHome ? "portal-people-grid__footer-cta" : "lg:hidden"
              )}
            >
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
