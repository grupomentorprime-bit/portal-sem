import { sortVisibleHeroItems } from "@/lib/portal/admission-hero-utils";
import type { AdmissionDatesHighlight, AdmissionHeroAction } from "@/types/admission";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer } from "@/components/portal/layout";
import { Button } from "@/components/ui/button";
import { iconSizes } from "@/design";

interface AdmissionDatesHighlightBarProps {
  config: AdmissionDatesHighlight;
  primaryAction?: AdmissionHeroAction;
}

export function AdmissionDatesHighlightBar({
  config,
  primaryAction,
}: AdmissionDatesHighlightBarProps) {
  if (!config.enabled) return null;

  const items = sortVisibleHeroItems(config.items);
  if (items.length === 0) return null;

  const showCta = primaryAction?.visible !== false && primaryAction?.label && primaryAction?.href;

  return (
    <section className="admission-dates-bar" aria-label={config.title}>
      <PortalContainer size="lg">
        <div className="admission-dates-bar__inner">
          <div className="admission-dates-bar__lead">
            <span className="admission-dates-bar__lead-icon" aria-hidden>
              <BlockIcon name="Calendar" size={iconSizes.md} />
            </span>
            <div className="admission-dates-bar__lead-copy">
              <span className="admission-dates-bar__title">{config.title}</span>
              <span className="admission-dates-bar__status">{config.statusLabel}</span>
            </div>
          </div>

          <div className="admission-dates-bar__items" role="list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`admission-dates-bar__item${item.highlight ? " admission-dates-bar__item--highlight" : ""}`}
                role="listitem"
              >
                {item.icon ? (
                  <span className="admission-dates-bar__item-icon" aria-hidden>
                    <BlockIcon name={item.icon} size={iconSizes.sm} />
                  </span>
                ) : null}
                <div className="admission-dates-bar__item-copy">
                  <span className="admission-dates-bar__item-label">{item.label}</span>
                  <span className="admission-dates-bar__item-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          {showCta ? (
            <div className="admission-dates-bar__cta-wrap">
              <Button
                href={primaryAction.href}
                size="lg"
                variant="primary"
                className="admission-dates-bar__cta"
              >
                {primaryAction.label}
                {primaryAction.icon ? (
                  <BlockIcon name={primaryAction.icon} size={iconSizes.sm} strokeWidth={2} aria-hidden />
                ) : null}
              </Button>
            </div>
          ) : null}
        </div>
      </PortalContainer>
    </section>
  );
}
