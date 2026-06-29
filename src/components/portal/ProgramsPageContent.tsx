"use client";

import { useMemo, useState } from "react";
import type { ProgramItem, ProgramStatus } from "@/types/content";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { ProgramCard } from "@/components/portal/cards";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";

const FILTERS: Array<{ id: ProgramStatus | "all"; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "admission_open", label: "Admisión abierta" },
  { id: "coming_soon", label: "Próximamente" },
];

interface ProgramsListClientProps {
  programs: ProgramItem[];
}

export function ProgramsListClient({ programs }: ProgramsListClientProps) {
  const [filter, setFilter] = useState<ProgramStatus | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return programs;
    return programs.filter((p) => p.status === filter);
  }, [programs, filter]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              focusRing,
              filter === item.id
                ? "bg-primary text-text-inverse"
                : "bg-background-soft text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="No hay programas en esta categoría"
          description="Prueba otro filtro o vuelve más tarde."
          actionLabel="Ver todos"
          actionHref="/programas"
        />
      )}
    </>
  );
}

interface ProgramsPageContentProps {
  programs: ProgramItem[];
}

export function ProgramsPageContent({ programs }: ProgramsPageContentProps) {
  return (
    <>
      <PortalPageHeader
        title="Programas académicos"
        description="Explora nuestra oferta formativa en teología, filosofía y ministerio pastoral."
      />
      <PortalSection padding="md">
        <PortalContainer>
          {programs.length > 0 ? (
            <ProgramsListClient programs={programs} />
          ) : (
            <PortalEmptyState
              title="Sin programas publicados"
              description="Los programas académicos se gestionan desde el panel de administración."
            />
          )}
        </PortalContainer>
      </PortalSection>
    </>
  );
}
