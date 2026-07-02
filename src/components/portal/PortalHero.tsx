/**
 * @deprecated
 *
 * Reemplazado por:
 * HeroPremiumSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import Link from "next/link";
import { PortalContainer } from "@/components/portal/layout";
import { PortalHeroMedia } from "@/components/portal/PortalHeroMedia";
import { focusRing } from "@/components/ui/shared";
import { HOME_SECTION_ID } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";

interface PortalHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  heroImage?: string;
  heroImageAlt?: string;
  overlayOpacity?: number;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function PortalHero({
  title,
  subtitle,
  description,
  heroImage,
  heroImageAlt,
  overlayOpacity = 75,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PortalHeroProps) {
  return (
    <section
      id={HOME_SECTION_ID}
      className="portal-hero-premium relative overflow-hidden bg-primary"
      aria-label="Presentación institucional"
    >
      <div className="portal-hero-premium__bg" aria-hidden />
      <div className="portal-hero-premium__orb portal-hero-premium__orb--accent" aria-hidden />
      <div className="portal-hero-premium__orb portal-hero-premium__orb--secondary" aria-hidden />
      <div className="portal-hero-premium__grid-lines" aria-hidden />

      <PortalContainer size="full" className="relative z-10">
        <div className="portal-hero-premium__layout">
          <div className="portal-hero-premium__content animate-slide-up">
            <h1 className="text-display-xxl text-text-inverse">{title}</h1>

            {subtitle ? (
              <p className="portal-hero-premium__subtitle mt-6">{subtitle}</p>
            ) : null}

            {description ? (
              <p className="mt-6 max-w-xl text-body leading-relaxed text-text-inverse/80 lg:text-lg">
                {description}
              </p>
            ) : null}

            {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                {primaryLabel && primaryHref ? (
                  <Link
                    href={primaryHref}
                    className={cn("portal-btn-apply portal-btn-apply--hero", focusRing)}
                  >
                    {primaryLabel}
                  </Link>
                ) : null}
                {secondaryLabel && secondaryHref ? (
                  <Link
                    href={secondaryHref}
                    className={cn("portal-btn-hero-secondary", focusRing)}
                  >
                    {secondaryLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="portal-hero-premium__media animate-fade-in">
            <PortalHeroMedia
              src={heroImage}
              alt={heroImageAlt}
              overlayOpacity={overlayOpacity}
            />
          </div>
        </div>
      </PortalContainer>
    </section>
  );
}
