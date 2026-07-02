"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import type { ProgramItem } from "@/types/content";
import {
  DEFAULT_PREMIUM_PROGRAM_FILTERS,
  DEFAULT_PROGRAMS_HELP_CTA,
  type ProgramPremiumFilter,
  type ProgramsHelpCtaConfig,
} from "@/lib/portal/program-premium-config";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { ProgramFilters } from "./ProgramFilters";
import { ProgramPremiumCard } from "./ProgramPremiumCard";
import { ProgramsHelpCTA } from "./ProgramsHelpCTA";

export interface ProgramsPremiumSectionProps {
  programs: ProgramItem[];
  overline?: string;
  title?: string;
  description?: string;
  cardCtaLabel?: string;
  filters?: ProgramPremiumFilter[];
  pageSize?: number;
  showPagination?: boolean;
  showHelpCta?: boolean;
  helpCta?: ProgramsHelpCtaConfig;
  className?: string;
  layout?: "home" | "page";
}

export function ProgramsPremiumSection({
  programs,
  overline,
  title,
  description,
  cardCtaLabel = "Conocer programa",
  filters = DEFAULT_PREMIUM_PROGRAM_FILTERS,
  pageSize = 3,
  showPagination = true,
  showHelpCta = true,
  helpCta = DEFAULT_PROGRAMS_HELP_CTA,
  className,
  layout = "home",
}: ProgramsPremiumSectionProps) {
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const activeFilter = useMemo(
    () => filters.find((f) => f.id === activeFilterId) ?? filters[0],
    [filters, activeFilterId]
  );

  const filteredPrograms = useMemo(() => {
    if (!activeFilter) return programs;
    return programs.filter((p) => activeFilter.match(p));
  }, [programs, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedPrograms = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPrograms.slice(start, start + pageSize);
  }, [filteredPrograms, safePage, pageSize]);

  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilterId(filterId);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  if (programs.length === 0) return null;

  return (
    <section
      className={cn(
        "programs-premium",
        layout === "page" && "programs-premium--page",
        className
      )}
      aria-labelledby={title ? "programs-premium-title" : undefined}
    >
      <header className="programs-premium__header">
        <div className="programs-premium__header-copy">
          {overline ? (
            <p className="programs-premium__eyebrow">{overline}</p>
          ) : null}
          {title ? (
            <h2 id="programs-premium-title" className="programs-premium__title">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="programs-premium__description">{description}</p>
          ) : null}
        </div>

        <ProgramFilters
          filters={filters}
          activeFilterId={activeFilterId}
          onFilterChange={handleFilterChange}
          className="programs-premium__header-filters"
        />
      </header>

      {paginatedPrograms.length > 0 ? (
        <ul className="programs-premium__grid" role="list">
          {paginatedPrograms.map((program, index) => (
            <li key={program.id} className="programs-premium__grid-item">
              <ProgramPremiumCard
                program={program}
                programIndex={programs.indexOf(program)}
                ctaLabel={cardCtaLabel}
                priorityImage={layout === "home" && index === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <PortalEmptyState
          title="No hay programas en esta categoría"
          description="Prueba otro filtro o explora el catálogo completo."
        />
      )}

      {showPagination && totalPages > 1 ? (
        <nav
          className="programs-premium__pagination"
          aria-label="Paginación de programas"
        >
          <button
            type="button"
            className={cn("programs-premium__page-btn", focusRing)}
            aria-label="Página anterior"
            disabled={safePage <= 1}
            onClick={() => handlePageChange(safePage - 1)}
          >
            <ChevronLeft strokeWidth={2} aria-hidden />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={cn(
                "programs-premium__page-btn",
                "programs-premium__page-num",
                page === safePage && "programs-premium__page-btn--active",
                focusRing
              )}
              aria-label={`Página ${page}`}
              aria-current={page === safePage ? "page" : undefined}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className={cn("programs-premium__page-btn", focusRing)}
            aria-label="Página siguiente"
            disabled={safePage >= totalPages}
            onClick={() => handlePageChange(safePage + 1)}
          >
            <ChevronRight strokeWidth={2} aria-hidden />
          </button>
        </nav>
      ) : null}

      {showHelpCta ? <ProgramsHelpCTA config={helpCta} /> : null}
    </section>
  );
}
