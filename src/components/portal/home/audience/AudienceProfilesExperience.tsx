import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { focusRing } from "@/components/ui/shared";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

export interface AudienceProfileItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  href?: string;
  visible?: boolean;
  featured?: boolean;
}

interface AudienceProfilesExperienceProps {
  overline?: string;
  title?: string;
  description?: string;
  profiles: AudienceProfileItem[];
  image?: string;
  imageAlt?: string;
  quote?: string;
  ctaLabel?: string;
  ctaHref?: string;
  id?: string;
}

function ProfileCard({
  profile,
  index,
  featuredCtaLabel,
}: {
  profile: AudienceProfileItem;
  index: number;
  featuredCtaLabel?: string;
}) {
  const isFeatured = profile.featured === true;
  const indexLabel = String(index + 1).padStart(2, "0");

  const inner = (
    <>
      <span className="audience-profiles__index" aria-hidden>
        {indexLabel}
      </span>
      <span className="audience-profiles__card-body">
        <span className="audience-profiles__card-head">
          {!isFeatured && profile.icon ? (
            <span className="audience-profiles__icon" aria-hidden>
              <BlockIcon name={profile.icon} size={18} strokeWidth={1.75} />
            </span>
          ) : null}
          <strong className="audience-profiles__card-title">{profile.title}</strong>
        </span>
        <span className="audience-profiles__card-description">{profile.description}</span>
        {isFeatured && profile.href ? (
          <span className="audience-profiles__card-link">
            {featuredCtaLabel ?? "Explorar admisión"}
            <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </span>
    </>
  );

  const className = cn(
    "audience-profiles__card",
    isFeatured && "audience-profiles__card--featured",
    focusRing
  );

  if (profile.href) {
    return (
      <Link href={profile.href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function AudienceProfilesExperience({
  overline,
  title,
  description,
  profiles,
  image,
  imageAlt = "Estudiantes del SEM en formación bíblica",
  quote,
  ctaLabel = "Explorar admisión",
  ctaHref = "/admision",
  id = "perfil-postulante",
}: AudienceProfilesExperienceProps) {
  const visible = profiles.filter((p) => p.visible !== false);
  if (!title?.trim() && visible.length === 0) return null;

  return (
    <PortalSection id={id} padding="lg" className="audience-profiles-section">
      <PortalContainer>
        <div className="audience-profiles animate-slide-up" role="region" aria-labelledby="audience-profiles-heading">
          <div className="audience-profiles__layout">
            {image ? (
              <aside className="audience-profiles__visual" aria-label="Formación ministerial en el SEM">
                <div className="audience-profiles__visual-frame">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    loading="lazy"
                    className="audience-profiles__visual-image"
                    sizes="(max-width: 1023px) 100vw, 340px"
                  />
                  <div className="audience-profiles__visual-overlay" aria-hidden />
                </div>
                {quote ? (
                  <blockquote className="audience-profiles__quote">
                    <p>{quote}</p>
                  </blockquote>
                ) : null}
              </aside>
            ) : null}

            <div className="audience-profiles__content">
              <header className="audience-profiles__header">
                {overline ? <p className="audience-profiles__eyebrow">{overline}</p> : null}
                {title ? (
                  <h2 id="audience-profiles-heading" className="audience-profiles__title">
                    {title}
                  </h2>
                ) : null}
                {description ? <p className="audience-profiles__description">{description}</p> : null}
              </header>

              <ul className="audience-profiles__bento" role="list">
                {visible.map((profile, index) => (
                  <li
                    key={profile.id}
                    className={cn(
                      "audience-profiles__item",
                      profile.featured && "audience-profiles__item--featured",
                      `audience-profiles__item--stagger-${Math.min(index + 1, 4)}`
                    )}
                  >
                    <ProfileCard
                      profile={profile}
                      index={index}
                      featuredCtaLabel={ctaLabel}
                    />
                  </li>
                ))}
              </ul>

              {ctaHref && ctaLabel ? (
                <footer className="audience-profiles__footer">
                  <p className="audience-profiles__footer-text">¿Te identificas con alguno de estos perfiles?</p>
                  <Link href={ctaHref} className={cn("audience-profiles__footer-cta", focusRing)}>
                    <span>{ctaLabel}</span>
                    <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
                  </Link>
                </footer>
              ) : null}
            </div>
          </div>
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
