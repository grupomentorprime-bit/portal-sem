"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveProgramHeroGalleryImage } from "@/lib/portal/program-image-fallbacks";
import { DEMO_PROGRAM_TRUST_STATS } from "@/lib/portal/program-trust-stats";
import type { ProgramItem } from "@/types/content";
import { FeaturedProgramCard } from "@/components/portal/programs/FeaturedProgramCard";
import { ProgramMiniCard } from "@/components/portal/programs/ProgramMiniCard";
import { FeaturedProgramsHero } from "./FeaturedProgramsHero";
import {
  DEFAULT_PROGRAM_FILTERS,
  ProgramFilterChips,
} from "./ProgramFilterChips";
import { ProgramTrustBar } from "./ProgramTrustBar";

const FAITH_TAGLINE =
  "Formación bíblica con excelencia académica y corazón pastoral.";

interface FeaturedProgramsExperienceProps {
  programs: ProgramItem[];
  overline?: string;
  title?: string;
  description?: string;
  showCatalogLink?: boolean;
  catalogHref?: string;
  catalogLabel?: string;
  cardCtaLabel?: string;
  className?: string;
}

export function FeaturedProgramsExperience({
  programs,
  overline,
  title,
  description,
  showCatalogLink,
  catalogHref,
  catalogLabel,
  cardCtaLabel = "Conocer programa",
  className,
}: FeaturedProgramsExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [stackKey, setStackKey] = useState(0);

  const safeIndex = activeIndex % programs.length;
  const featured = programs[safeIndex];

  const secondaryPrograms = useMemo(
    () =>
      programs
        .map((program, index) => ({ program, index }))
        .filter(({ index }) => index !== safeIndex)
        .slice(0, 3),
    [programs, safeIndex]
  );

  const galleryImage = resolveProgramHeroGalleryImage(programs, safeIndex);
  const galleryAlt = "Comunidad estudiantil y formación ministerial SEM";
  const socialProof = DEMO_PROGRAM_TRUST_STATS[0];

  const handleIndicator = useCallback((index: number) => {
    setActiveIndex(index);
    setActiveFilterId("all");
    setStackKey((key) => key + 1);
  }, []);

  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilterId(filterId);
      const filter = DEFAULT_PROGRAM_FILTERS.find((item) => item.id === filterId);
      if (!filter || filterId === "all") return;

      const matchIndex = programs.findIndex((program) => filter.match(program));
      if (matchIndex >= 0) {
        setActiveIndex(matchIndex);
        setStackKey((key) => key + 1);
      }
    },
    [programs]
  );

  if (!featured) return null;

  return (
    <div
      className={cn("featured-programs", className)}
      role="region"
      aria-label="Programas destacados"
    >
      <FeaturedProgramsHero
        overline={overline}
        title={title}
        description={description}
        tagline={FAITH_TAGLINE}
        showCatalogLink={showCatalogLink}
        catalogHref={catalogHref}
        catalogLabel={catalogLabel}
        galleryImage={galleryImage}
        galleryAlt={galleryAlt}
      />

      <ProgramFilterChips
        activeFilterId={activeFilterId}
        onFilterChange={handleFilterChange}
        className="featured-programs__filters"
      />

      <div
        key={stackKey}
        className="featured-programs__stack featured-programs__stack--enter"
      >
        <FeaturedProgramCard
          key={featured.id}
          program={featured}
          programIndex={safeIndex}
          ctaLabel={cardCtaLabel}
          priorityImage
          className="featured-programs__featured-card"
        />

        {socialProof ? (
          <p className="featured-programs__social-proof">
            <strong>{socialProof.value}</strong> {socialProof.title.toLowerCase()} en formación
          </p>
        ) : null}

        {secondaryPrograms.length > 0 ? (
          <ul className="featured-programs__secondary" role="list">
            {secondaryPrograms.map(({ program, index }) => (
              <li key={program.id} className="featured-programs__secondary-item">
                <ProgramMiniCard
                  program={program}
                  programIndex={index}
                  ctaLabel={cardCtaLabel}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {programs.length > 1 ? (
        <div className="featured-programs__indicators-wrap">
          <span className="featured-programs__indicators-label" id="fp-indicators-label">
            Explorar programas
          </span>
          <div
            className="featured-programs__indicators"
            role="tablist"
            aria-labelledby="fp-indicators-label"
          >
            {programs.map((program, index) => (
              <button
                key={program.id}
                type="button"
                role="tab"
                aria-selected={index === safeIndex}
                aria-label={`Destacar ${program.title}`}
                className={cn(
                  "featured-programs__indicator",
                  index === safeIndex && "featured-programs__indicator--active"
                )}
                onClick={() => handleIndicator(index)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
