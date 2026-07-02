import { cn } from "@/lib/utils";
import type { PortalCTAPremiumProps } from "@/types/cta-premium";
import { normalizeCtaPremiumSettings } from "./mappers";
import { PortalCTAButtons } from "./PortalCTAButtons";
import { PortalCTAContent } from "./PortalCTAContent";
import { PortalCTAImage } from "./PortalCTAImage";
import { PortalCTAStats } from "./PortalCTAStats";

const INVERSE_BACKGROUNDS = new Set(["primary", "secondary", "highlight"]);

export function PortalCTAPremium({ settings, id, className }: PortalCTAPremiumProps) {
  const config = normalizeCtaPremiumSettings(settings);
  const { title, buttons } = config;

  if (!title && buttons.length === 0) return null;

  const variant = config.variant;
  const background =
    variant === "highlight" && config.background === "primary"
      ? "primary"
      : config.background;
  const inverse = INVERSE_BACKGROUNDS.has(background) || variant === "highlight";
  const centered =
    variant === "center" || variant === "minimal" || variant === "highlight";
  const isBanner = variant === "banner";
  const hasImage = Boolean(config.image?.trim());
  const showStats = config.showStats && config.stats.length > 0;
  const showMedia = hasImage && (variant === "split" || variant === "banner");

  return (
    <section
      id={id}
      className={cn(
        "portal-cta-premium",
        `portal-cta-premium--${variant}`,
        `portal-cta-premium--bg-${background}`,
        inverse && "portal-cta-premium--inverse",
        className
      )}
      aria-labelledby={title ? "portal-cta-premium-title" : undefined}
    >
      <div className="portal-cta-premium__shell overflow-hidden rounded-[var(--radius-2xl)]">
        <div className={cn("portal-cta-premium__inner", showMedia && "portal-cta-premium__inner--media")}>
          <div className="portal-cta-premium__body">
            <PortalCTAContent
              overline={config.overline}
              title={title || " "}
              description={config.description}
              inverse={inverse}
              centered={centered}
              titleId="portal-cta-premium-title"
              className={isBanner ? "portal-cta-premium__content--banner" : undefined}
            />
            {showStats ? (
              <PortalCTAStats stats={config.stats} inverse={inverse} className="mt-8" />
            ) : null}
            <PortalCTAButtons buttons={buttons} inverse={inverse} className="mt-8" />
          </div>
          {showMedia ? (
            <PortalCTAImage
              src={config.image}
              alt={config.imageAlt ?? "CTA"}
              className="portal-cta-premium__media-wrap"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
