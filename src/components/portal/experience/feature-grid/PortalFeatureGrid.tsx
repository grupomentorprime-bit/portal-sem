import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { asString } from "@/lib/cms/block-utils";
import type { PortalFeatureGridProps } from "@/types/feature-grid";
import { PortalFeatureCard } from "./PortalFeatureCard";

export function PortalFeatureGrid({
  settings,
  features,
  id = "feature-grid",
  muted = false,
}: PortalFeatureGridProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);
  const emptyTitle = asString(settings.emptyTitle);
  const emptyDescription = asString(settings.emptyDescription);
  const showHeader = Boolean(overline || title || description);
  const featureCount = features.length;

  return (
    <PortalSection id={id} muted={muted}>
      <PortalContainer>
        <div className="portal-feature-grid animate-slide-up">
          {showHeader ? (
            <header className="portal-feature-grid__header mb-12 max-w-3xl">
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
            </header>
          ) : null}

          {featureCount > 0 ? (
            <ul
              className={cnGridClass(featureCount)}
              role="list"
              aria-label={title || "Características"}
            >
              {features.map((feature) => (
                <li key={feature.id} className="h-full">
                  <PortalFeatureCard feature={feature} />
                </li>
              ))}
            </ul>
          ) : emptyTitle ? (
            <PortalEmptyState title={emptyTitle} description={emptyDescription || undefined} />
          ) : null}
        </div>
      </PortalContainer>
    </PortalSection>
  );
}

function cnGridClass(count: number): string {
  const base = "portal-feature-grid__grid";
  if (count === 3) return `${base} portal-feature-grid__grid--count-3`;
  if (count === 6) return `${base} portal-feature-grid__grid--count-6`;
  if (count === 8) return `${base} portal-feature-grid__grid--count-8`;
  if (count === 12) return `${base} portal-feature-grid__grid--count-12`;
  return base;
}
