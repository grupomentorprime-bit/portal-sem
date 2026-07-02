import type { CSSProperties, ElementType } from "react";
import Link from "next/link";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import type { PortalFeatureItem } from "@/types/feature-grid";
import { cn } from "@/lib/utils";

interface PortalFeatureCardProps {
  feature: PortalFeatureItem;
  className?: string;
}

export function PortalFeatureCard({ feature, className }: PortalFeatureCardProps) {
  const titleId = `feature-${feature.id}-title`;
  const accentStyle = feature.color
    ? ({ "--feature-accent": feature.color } as CSSProperties)
    : undefined;

  const hasUrl = Boolean(feature.url?.trim());
  const Wrapper: ElementType = hasUrl ? Link : "div";
  const wrapperProps = hasUrl
    ? { href: feature.url!, className: cn("portal-feature-card group block h-full", focusRing, className) }
    : { className: cn("portal-feature-card group h-full", className) };

  return (
    <Wrapper {...wrapperProps} style={accentStyle} data-cursor={hasUrl ? "card" : undefined}>
      <article className="portal-feature-card__inner h-full" aria-labelledby={titleId}>
        <div className="portal-feature-card__icon" aria-hidden>
          <BlockIcon name={feature.icon} size={iconSizes.lg} strokeWidth={2} />
        </div>
        <h3 id={titleId} className="portal-feature-card__title text-heading text-foreground">
          {feature.title}
        </h3>
        {feature.description ? (
          <p className="portal-feature-card__description mt-2 text-body text-muted">
            {feature.description}
          </p>
        ) : null}
      </article>
    </Wrapper>
  );
}
