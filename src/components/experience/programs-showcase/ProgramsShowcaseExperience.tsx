"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgramFilters } from "@/components/portal/programs/ProgramFilters";
import type { ProgramItem } from "@/types/content";
import type { ProgramsShowcaseConfig } from "@/types/programs-showcase";
import {
  resolveShowcasePrograms,
  shouldShowProgramsShowcaseFilters,
  toShowcasePremiumFilters,
} from "@/lib/experience/programs-showcase-utils";
import { ProgramsShowcaseFeaturedCard } from "./ProgramsShowcaseFeaturedCard";
import { ProgramsShowcaseHeader } from "./ProgramsShowcaseHeader";
import { ProgramsShowcaseHelpBlock } from "./ProgramsShowcaseHelpBlock";
import { ProgramsShowcaseSecondaryCard } from "./ProgramsShowcaseSecondaryCard";

interface ProgramsShowcaseExperienceProps {
  config: ProgramsShowcaseConfig;
  programs: ProgramItem[];
  className?: string;
  titleId?: string;
}

export function ProgramsShowcaseExperience({
  config,
  programs,
  className,
  titleId = "programs-showcase-title",
}: ProgramsShowcaseExperienceProps) {
  const [activeFilterId, setActiveFilterId] = useState("all");

  const filters = useMemo(() => toShowcasePremiumFilters(config.filters), [config.filters]);
  const showFilters = useMemo(
    () => shouldShowProgramsShowcaseFilters(programs, config),
    [programs, config]
  );

  const activeFilter = useMemo(
    () => filters.find((filter) => filter.id === activeFilterId) ?? filters[0],
    [filters, activeFilterId]
  );

  const filteredPrograms = useMemo(() => {
    if (!showFilters || !activeFilter) return programs;
    return programs.filter((program) => activeFilter.match(program));
  }, [programs, activeFilter, showFilters]);

  const { featured, secondary } = useMemo(
    () => resolveShowcasePrograms(filteredPrograms, config),
    [filteredPrograms, config]
  );

  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilterId(filterId);
  }, []);

  if (!config.enabled || programs.length === 0 || !featured) return null;

  const animationClass =
    config.animation === "slide"
      ? "cms-animate-slide"
      : config.animation === "fade"
        ? "cms-animate-fade"
        : undefined;

  return (
    <section
      className={cn("programs-showcase", animationClass, className)}
      aria-labelledby={titleId}
    >
      <ProgramsShowcaseHeader config={config} titleId={titleId} />

      {showFilters && filters.length > 0 ? (
        <ProgramFilters
          filters={filters}
          activeFilterId={activeFilterId}
          onFilterChange={handleFilterChange}
          className="programs-showcase__filters"
        />
      ) : null}

      <div className="programs-showcase__featured">
        <ProgramsShowcaseFeaturedCard
          program={featured}
          programIndex={programs.indexOf(featured)}
          ctaLabel={config.cardCtaLabel}
          priorityImage
          className="programs-showcase__featured-card"
        />
      </div>

      {secondary.length > 0 ? (
        <ul className="programs-showcase__secondary-grid" role="list">
          {secondary.map((program) => (
            <li key={program.id} className="programs-showcase__secondary-item">
              <ProgramsShowcaseSecondaryCard
                program={program}
                programIndex={programs.indexOf(program)}
                ctaLabel={config.cardCtaLabel}
                className="programs-showcase__secondary-card"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <ProgramsShowcaseHelpBlock config={config.help} />
    </section>
  );
}
