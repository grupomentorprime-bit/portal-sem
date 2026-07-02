import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import { ProgramGallery } from "./ProgramGallery";

interface FeaturedProgramsHeroProps {
  overline?: string;
  title?: string;
  description?: string;
  tagline?: string;
  showCatalogLink?: boolean;
  catalogHref?: string;
  catalogLabel?: string;
  galleryImage: string;
  galleryAlt: string;
  className?: string;
}

export function FeaturedProgramsHero({
  overline,
  title,
  description,
  tagline,
  showCatalogLink = false,
  catalogHref,
  catalogLabel,
  galleryImage,
  galleryAlt,
  className,
}: FeaturedProgramsHeroProps) {
  return (
    <header className={cn("featured-programs-hero", className)}>
      <div className="featured-programs-hero__intro">
        {overline ? (
          <p className="featured-programs-hero__eyebrow">{overline}</p>
        ) : null}
        {title ? (
          <h2 className="featured-programs-hero__title">{title}</h2>
        ) : null}
        {description ? (
          <p className="featured-programs-hero__description">{description}</p>
        ) : null}
        {tagline ? (
          <p className="featured-programs-hero__tagline">{tagline}</p>
        ) : null}
        {showCatalogLink && catalogHref && catalogLabel ? (
          <div className="featured-programs-hero__actions">
            <Link
              href={catalogHref}
              className={cn(
                "featured-programs-hero__catalog-btn",
                focusRing
              )}
            >
              <span>{catalogLabel}</span>
              <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="featured-programs-hero__visual">
        <ProgramGallery
          src={galleryImage}
          alt={galleryAlt}
          priority
          className="featured-programs-hero__gallery"
        />
      </div>
    </header>
  );
}
