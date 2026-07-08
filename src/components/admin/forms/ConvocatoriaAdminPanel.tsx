"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import Link from "next/link";
import {
  AdminModulePage,
  ContentGrid,
  FilterBar,
  KpiCard,
  Section,
} from "@/components/admin/kit";
import { ExperienceFormSubmissionsTable } from "@/components/admin/forms/ExperienceFormSubmissionsTable";
import { ConvocatoriaRosterPanel } from "@/components/admin/forms/ConvocatoriaRosterPanel";
import { Button } from "@/components/ui/button";
import {
  absenceReviewStatusLabel,
  attendanceLabel,
  formatSubmissionPhone,
  getSubmissionGeneration,
  formatConvocatoriaDate,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormSubmission,
} from "@/types/experience-forms";

interface SubmissionStats {
  total: number;
  attending: number;
  notAttending: number;
  other: number;
}

interface ConvocatoriaAdminPanelProps {
  convocatoria: FormConvocatoria;
}

export function ConvocatoriaAdminPanel({ convocatoria }: ConvocatoriaAdminPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetch(
          `/api/experience/forms/submissions?formId=${encodeURIComponent(convocatoria.formId)}&limit=500`
        ),
        fetch(
          `/api/experience/forms/submissions?formId=${encodeURIComponent(convocatoria.formId)}&stats=true`
        ),
      ]);
      const subsData = await subsRes.json();
      const statsData = await statsRes.json();

      if (!subsData.ok || !statsData.ok) {
        setError("No se pudieron cargar las respuestas.");
        return;
      }

      setSubmissions(subsData.submissions ?? []);
      setStats(statsData.stats ?? null);
    } catch {
      setError("Error de red al cargar respuestas.");
    } finally {
      setLoading(false);
    }
  }, [convocatoria.formId]);

  useDeferredEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = submissions.filter((submission) => {
    if (filter !== "all" && submission.data.attendance !== filter) return false;
    if (generationFilter !== "all" && getSubmissionGeneration(submission.data) !== generationFilter) {
      return false;
    }
    return true;
  });

  const generationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const submission of submissions) {
      const generation = getSubmissionGeneration(submission.data);
      if (generation === "—") continue;
      counts.set(generation, (counts.get(generation) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [submissions]);

  const hasGeneration = generationOptions.length > 0;
  const hasActiveFilters = filter !== "all" || generationFilter !== "all";

  const handleReviewSaved = (submissionId: string, review: ExperienceFormAbsenceReview) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId ? { ...submission, absenceReview: review } : submission
      )
    );
  };

  const exportCsv = () => {
    const headers = [
      "Nombre",
      "Generación",
      "Teléfono",
      "Correo",
      "Asistencia",
      "Justificación",
      "Estado gestión",
      "Respaldo recibido",
      "Detalle respaldo",
      "Gestiones realizadas",
      "Fecha",
    ];
    const rows = filtered.map((submission) => {
      const data = submission.data;
      const review = submission.absenceReview;
      return [
        String(data.fullName ?? ""),
        getSubmissionGeneration(data),
        formatSubmissionPhone(data.phone),
        String(data.email ?? ""),
        attendanceLabel(data.attendance),
        String(data.justification ?? ""),
        absenceReviewStatusLabel(review?.status),
        review?.evidenceReceived ? "Sí" : "No",
        String(review?.evidenceNotes ?? ""),
        String(review?.managementNotes ?? ""),
        formatSubmissionDate(submission.createdAt),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${convocatoria.slug}${generationFilter !== "all" ? `-${generationFilter}` : ""}-respuestas.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Formularios" },
        { label: "Gestión", href: "/admin/portal/forms" },
        { label: convocatoria.title },
      ]}
      title={convocatoria.title}
      description={`${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`}
      actions={
        <>
          <Link href={publicFormUrl(convocatoria.formId)} target="_blank">
            <Button variant="outline" size="sm">
              Formulario público
            </Button>
          </Link>
          <Link href={`/admin/portal/forms/${convocatoria.formId}`}>
            <Button variant="outline" size="sm">
              Editar formulario
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void loadData()}>
            Actualizar
          </Button>
        </>
      }
    >
      {stats ? (
        <ContentGrid cols={4} className="mb-6">
          <KpiCard label="Total respuestas" value={stats.total} />
          <KpiCard label="Asistirán" value={stats.attending} variant="success" />
          <KpiCard label="No asistirán" value={stats.notAttending} variant="warning" />
          <KpiCard label="Sin definir" value={stats.other} />
        </ContentGrid>
      ) : null}

      <Section
        title="Listado de alumnos convocados"
        description="Carga los nombres y generaciones para que cada alumno se identifique en el formulario público."
      >
        <ConvocatoriaRosterPanel convocatoriaSlug={convocatoria.slug} />
      </Section>

      <Section
        title="Respuestas de la convocatoria"
        description={`${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`}
      >
        <FilterBar
          className="mb-4"
          filters={
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={filter === "all" ? "primary" : "outline"}
                  onClick={() => setFilter("all")}
                >
                  Todas ({submissions.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filter === "yes" ? "primary" : "outline"}
                  onClick={() => setFilter("yes")}
                >
                  Asistirán ({stats?.attending ?? 0})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={filter === "no" ? "primary" : "outline"}
                  onClick={() => setFilter("no")}
                >
                  No asistirán ({stats?.notAttending ?? 0})
                </Button>
              </div>
              {hasGeneration ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={generationFilter === "all" ? "primary" : "outline"}
                    onClick={() => setGenerationFilter("all")}
                  >
                    Todas las generaciones ({submissions.length})
                  </Button>
                  {generationOptions.map(([generation, count]) => (
                    <Button
                      key={generation}
                      type="button"
                      size="sm"
                      variant={generationFilter === generation ? "primary" : "outline"}
                      onClick={() => setGenerationFilter(generation)}
                    >
                      {generation} ({count})
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          }
          onReset={
            hasActiveFilters
              ? () => {
                  setFilter("all");
                  setGenerationFilter("all");
                }
              : undefined
          }
        />

        <ExperienceFormSubmissionsTable
          submissions={filtered}
          total={submissions.length}
          loading={loading}
          error={error}
          onRefresh={() => void loadData()}
          onReviewSaved={handleReviewSaved}
        />
      </Section>
    </AdminModulePage>
  );
}

function formatSubmissionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
