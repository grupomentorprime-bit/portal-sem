import Link from "next/link";
import { ArrowRight, Download, Plus, Upload, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { programPreviewHref } from "@/lib/admin/programs-hub-utils";
import type { ContentDocument } from "@/types/content";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

interface ProgramHubSidebarProps {
  programs: ContentDocument[];
  applicantCounts: Record<string, number>;
  featuredProgramId?: string;
  onExport: () => void;
  onImport: () => void;
}

export function ProgramHubSidebar({
  programs,
  applicantCounts,
  featuredProgramId,
  onExport,
  onImport,
}: ProgramHubSidebarProps) {
  const published = programs.filter((program) => program.status === "published");
  const admissionOpen = published.filter((program) => program.programStatus === "admission_open");
  const featured = programs.find((program) => program._id === featuredProgramId) ?? published[0];
  const topApplicants = [...published]
    .sort((a, b) => (applicantCounts[b._id] ?? 0) - (applicantCounts[a._id] ?? 0))
    .slice(0, 3);

  return (
    <aside className="program-hub-sidebar">
      <section className="program-hub-sidebar__panel">
        <h2 className="program-hub-sidebar__title">Resumen</h2>
        <dl className="program-hub-sidebar__stats">
          <div>
            <dt>Programas activos</dt>
            <dd>{published.length}</dd>
          </div>
          <div>
            <dt>Próximas admisiones</dt>
            <dd>{admissionOpen.length}</dd>
          </div>
          <div>
            <dt>Total postulantes</dt>
            <dd>{Object.values(applicantCounts).reduce((sum, count) => sum + count, 0)}</dd>
          </div>
        </dl>
      </section>

      {featured ? (
        <section className="program-hub-sidebar__panel">
          <h2 className="program-hub-sidebar__title">Programa destacado</h2>
          <p className="program-hub-sidebar__highlight">{featured.title}</p>
          <p className="program-hub-sidebar__meta">
            {applicantCounts[featured._id] ?? 0} postulantes · Actualizado{" "}
            {formatRelativeTime(featured.updatedAt)}
          </p>
          <Link
            href={`/admin/content/programs/edit/${featured._id}`}
            className={cn("program-hub-sidebar__link", focusRing)}
          >
            Gestionar destacado
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : null}

      {topApplicants.length > 0 ? (
        <section className="program-hub-sidebar__panel">
          <h2 className="program-hub-sidebar__title">Mayor interés</h2>
          <ul className="program-hub-sidebar__list">
            {topApplicants.map((program) => (
              <li key={program._id}>
                <Link
                  href={programPreviewHref(program)}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("program-hub-sidebar__list-item", focusRing)}
                >
                  <span>{program.title}</span>
                  <span className="program-hub-sidebar__list-meta">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {applicantCounts[program._id] ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="program-hub-sidebar__panel">
        <h2 className="program-hub-sidebar__title">Atajos</h2>
        <div className="program-hub-sidebar__shortcuts">
          <Link href="/admin/content/programs/edit/new">
            <Button size="sm" className="w-full justify-center">
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo programa
            </Button>
          </Link>
          <Button size="sm" variant="outline" className="w-full justify-center" onClick={onImport}>
            <Upload className="h-4 w-4" aria-hidden />
            Importar
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-center" onClick={onExport}>
            <Download className="h-4 w-4" aria-hidden />
            Exportar catálogo
          </Button>
          <Link href="/admin/portal/admission">
            <Button size="sm" variant="ghost" className="w-full justify-center">
              Centro de admisión
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </section>
    </aside>
  );
}
