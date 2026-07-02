import { resolveBlockIcon } from "@/lib/cms/block-utils";
import {
  sortMicroBenefits,
  sortVisibleHeroItems,
} from "@/lib/portal/admission-hero-utils";
import type { AdmissionHeroContent } from "@/types/admission";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { Button } from "@/components/ui/button";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { AdmissionHeroMediaPanel } from "./AdmissionHeroMediaPanel";

interface AdmissionHeroProps {
  content: AdmissionHeroContent;
  tenant: string;
  sectionId?: string;
  breadcrumb?: ReactNode;
}

function HeroTitle({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight?.trim() || !title.includes(highlight)) {
    return <h1 className="admission-hero__title">{title}</h1>;
  }

  const index = title.indexOf(highlight);
  return (
    <h1 className="admission-hero__title">
      {title.slice(0, index)}
      <span className="admission-hero__title-highlight">{highlight}</span>
      {title.slice(index + highlight.length)}
    </h1>
  );
}

function badgeToneClass(tone: AdmissionHeroContent["statusBadge"]["tone"]): string {
  switch (tone) {
    case "success":
      return "admission-hero__status-badge--success";
    case "info":
      return "admission-hero__status-badge--info";
    default:
      return "admission-hero__status-badge--neutral";
  }
}

function actionVariant(
  variant: AdmissionHeroContent["actions"][number]["variant"]
): "primary" | "secondary" | "outline" | "ghost" {
  switch (variant) {
    case "primary":
      return "primary";
    case "secondary":
      return "secondary";
    case "tertiary":
      return "outline";
    case "ghost":
      return "ghost";
    default:
      return "outline";
  }
}

function actionClass(variant: AdmissionHeroContent["actions"][number]["variant"]): string {
  switch (variant) {
    case "primary":
      return "admission-hero__cta admission-hero__cta--primary";
    case "secondary":
      return "admission-hero__cta admission-hero__cta--secondary";
    case "tertiary":
      return "admission-hero__cta admission-hero__cta--tertiary";
    default:
      return "admission-hero__cta admission-hero__cta--ghost";
  }
}

export async function AdmissionHero({
  content,
  tenant,
  sectionId = "centro-admision",
  breadcrumb,
}: AdmissionHeroProps) {
  if (!content.enabled) return null;

  const actions = sortVisibleHeroItems(content.actions);
  const indicators = sortVisibleHeroItems(content.indicators);
  const microBenefits = sortMicroBenefits(content.microBenefits);
  const badge = content.statusBadge;
  const BadgeIcon = badge?.icon ? resolveBlockIcon(badge.icon) : null;
  const animations = content.animations;
  const animateClass =
    animations?.enabled !== false
      ? animations?.entrance === "slide"
        ? "cms-animate-slide"
        : animations?.entrance === "fade"
          ? "cms-animate-fade"
          : "cms-animate-fade"
      : undefined;
  const elevationClass =
    animations?.hoverElevation !== false ? "admission-hero__shell--elevated" : undefined;

  return (
    <PortalSection id={sectionId} className="admission-hero" padding="none">
      <div className={cn("admission-hero__shell", animateClass, elevationClass)}>
        <div className="admission-hero__grid">
          <div className="admission-hero__copy">
            <div className="admission-hero__copy-bg" aria-hidden />
            <PortalContainer size="md" className="admission-hero__copy-inner">
              {breadcrumb ? (
                <div className="admission-hero__breadcrumb">{breadcrumb}</div>
              ) : null}

              {content.eyebrow ? (
                <p className="admission-hero__eyebrow">{content.eyebrow}</p>
              ) : null}

              {badge?.visible && badge.text ? (
                <div
                  className={`admission-hero__status-badge ${badgeToneClass(badge.tone)}`}
                >
                  {BadgeIcon ? (
                    <BadgeIcon size={iconSizes.sm} strokeWidth={2} aria-hidden />
                  ) : null}
                  <span>{badge.text}</span>
                </div>
              ) : null}

              <HeroTitle title={content.title} highlight={content.highlight} />

              {content.subtitle ? (
                <p className="admission-hero__subtitle">{content.subtitle}</p>
              ) : null}

              {content.description ? (
                <p className="admission-hero__description">{content.description}</p>
              ) : null}

              {actions.length > 0 ? (
                <div
                  className={cn(
                    "admission-hero__actions",
                    animations?.hoverCta !== false && "admission-hero__actions--interactive"
                  )}
                >
                  {actions.map((action) => {
                    const ActionIcon = action.icon ? resolveBlockIcon(action.icon) : null;
                    return (
                      <Button
                        key={action.id}
                        href={action.href}
                        size="lg"
                        variant={actionVariant(action.variant)}
                        className={actionClass(action.variant)}
                      >
                        {action.label}
                        {ActionIcon ? (
                          <ActionIcon size={iconSizes.sm} strokeWidth={2} aria-hidden />
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              ) : null}

              {indicators.length > 0 ? (
                <div className="admission-hero__indicators" role="list">
                  {indicators.map((item) => {
                    const inner = (
                      <>
                        {item.icon ? (
                          <span className="admission-hero__indicator-icon" aria-hidden>
                            <BlockIcon name={item.icon} size={iconSizes.sm} />
                          </span>
                        ) : null}
                        <span className="admission-hero__indicator-value">{item.value}</span>
                        <span className="admission-hero__indicator-label">{item.label}</span>
                        {item.description ? (
                          <span className="admission-hero__indicator-desc">{item.description}</span>
                        ) : null}
                      </>
                    );

                    return item.link ? (
                      <a
                        key={item.id}
                        href={item.link}
                        className="admission-hero__indicator"
                        role="listitem"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={item.id} className="admission-hero__indicator" role="listitem">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {microBenefits.length > 0 ? (
                <ul className="admission-hero__benefit-chips" role="list">
                  {microBenefits.map((benefit) => (
                    <li key={benefit.id} className="admission-hero__benefit-chip">
                      {benefit.icon ? (
                        <BlockIcon
                          name={benefit.icon}
                          size={iconSizes.sm}
                          className="admission-hero__benefit-chip-icon"
                          aria-hidden
                        />
                      ) : null}
                      <span>{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </PortalContainer>
          </div>

          <AdmissionHeroMediaPanel content={content} tenant={tenant} />
        </div>
      </div>
    </PortalSection>
  );
}
