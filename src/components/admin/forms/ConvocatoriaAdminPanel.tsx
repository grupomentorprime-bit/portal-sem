"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ClipboardList, MapPin, Users, XCircle } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { SubmissionJustificationCell } from "@/components/admin/forms/SubmissionJustificationCell";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { ConvocatoriaRosterPanel } from "@/components/admin/forms/ConvocatoriaRosterPanel";
import { Alert, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  ABSENCE_REVIEW_POLICY,
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => {
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

  const groupedByGeneration = useMemo(() => {
    if (generationFilter !== "all" || !hasGeneration) return null;
    const groups = new Map<string, ExperienceFormSubmission[]>();
    for (const submission of filtered) {
      const generation = getSubmissionGeneration(submission.data);
      const bucket = groups.get(generation) ?? [];
      bucket.push(submission);
      groups.set(generation, bucket);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [filtered, generationFilter, hasGeneration]);

  const handleReviewSaved = (submissionId: string, review: ExperienceFormAbsenceReview) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId ? { ...submission, absenceReview: review } : submission
      )
    );
    setExpandedId(null);
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
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios", href: "/admin/portal/forms" },
        { label: convocatoria.title },
      ]}
      title={convocatoria.title}
      description={`${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={publicFormUrl(convocatoria.formId)}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Formulario público
          </Link>
          <Link
            href={`/admin/portal/forms/${convocatoria.formId}`}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Editar formulario
          </Link>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void loadData()}>
            Actualizar
          </Button>
        </div>
      }
    >
      <AdminModuleCenter>
        <AdminModuleHero
          eyebrow="Portal · Convocatoria"
          heroTitle={convocatoria.title}
          heroDescription={convocatoria.description}
        />

      {stats ? (
        <AdminModuleStats
          items={[
            { label: "Total respuestas", value: stats.total, icon: ClipboardList, tone: "total" },
            { label: "Asistirán", value: stats.attending, icon: Users, tone: "active" },
            { label: "No asistirán", value: stats.notAttending, icon: XCircle, tone: "published" },
            { label: "Sin definir", value: stats.other, icon: Calendar, tone: "neutral" },
          ]}
        />
      ) : null}

      <AdminModuleSectionHeader
        icon={MapPin}
        title="Listado de alumnos convocados"
        description="Carga los nombres y generaciones para que cada alumno se identifique en el formulario público."
      />
      <ConvocatoriaRosterPanel convocatoriaSlug={convocatoria.slug} />

      <AdminModuleSectionHeader
        icon={MapPin}
        title="Respuestas de la convocatoria"
        description={`${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`}
      />

      <section className="mb-4 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Todas ({submissions.length})
        </FilterButton>
        <FilterButton active={filter === "yes"} onClick={() => setFilter("yes")}>
          Asistirán ({stats?.attending ?? 0})
        </FilterButton>
        <FilterButton active={filter === "no"} onClick={() => setFilter("no")}>
          No asistirán ({stats?.notAttending ?? 0})
        </FilterButton>
      </section>

      {hasGeneration ? (
        <section className="mb-4 flex flex-wrap gap-2">
          <FilterButton
            active={generationFilter === "all"}
            onClick={() => setGenerationFilter("all")}
          >
            Todas las generaciones ({submissions.length})
          </FilterButton>
          {generationOptions.map(([generation, count]) => (
            <FilterButton
              key={generation}
              active={generationFilter === generation}
              onClick={() => setGenerationFilter(generation)}
            >
              {generation} ({count})
            </FilterButton>
          ))}
        </section>
      ) : null}

      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Cargando respuestas…</p> : null}

      {filter === "no" || submissions.some((s) => s.data.attendance === "no") ? (
        <Alert variant="info" className="mb-4">
          {ABSENCE_REVIEW_POLICY}
        </Alert>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Aún no hay respuestas para esta convocatoria. Comparte el enlace del formulario con los
          participantes.
        </p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-border bg-background-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Generación</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Asistencia</th>
                <th className="px-4 py-3 font-medium">Justificación</th>
                <th className="px-4 py-3 font-medium">Gestión</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {groupedByGeneration
                ? groupedByGeneration.map(([generation, groupSubmissions]) => (
                    <Fragment key={generation}>
                      <tr className="border-b border-border bg-background-muted/40">
                        <td
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted"
                          colSpan={9}
                        >
                          {generation} · {groupSubmissions.length} respuesta
                          {groupSubmissions.length === 1 ? "" : "s"}
                        </td>
                      </tr>
                      {groupSubmissions.map((submission) => {
                        const isAbsence = submission.data.attendance === "no";
                        const submissionId = submission._id ?? "";
                        const isExpanded = expandedId === submissionId;

                        return (
                          <Fragment key={submission._id}>
                            <tr className="border-b border-border last:border-0">
                              <td className="px-4 py-3 font-medium">
                                <SubmissionParticipantName data={submission.data} />
                              </td>
                              <td className="px-4 py-3 text-muted">
                                {getSubmissionGeneration(submission.data)}
                              </td>
                              <td className="px-4 py-3 text-muted whitespace-nowrap">
                                {formatSubmissionPhone(submission.data.phone)}
                              </td>
                              <td className="px-4 py-3 text-muted">
                                {String(submission.data.email ?? "—")}
                              </td>
                              <td className="px-4 py-3">
                                <AttendanceBadge value={submission.data.attendance} />
                              </td>
                              <td className="max-w-xs px-4 py-3 text-muted">
                                {isAbsence ? (
                                  <SubmissionJustificationCell data={submission.data} />
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isAbsence ? (
                                  <AbsenceReviewBadge review={submission.absenceReview} />
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-muted whitespace-nowrap">
                                {formatSubmissionDate(submission.createdAt)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isAbsence && submissionId ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setExpandedId(isExpanded ? null : submissionId)
                                    }
                                  >
                                    {isExpanded ? "Cerrar" : "Gestionar"}
                                  </Button>
                                ) : null}
                              </td>
                            </tr>
                            {isAbsence && isExpanded && submissionId ? (
                              <tr className="border-b border-border bg-background-muted/20">
                                <td className="px-4 py-4" colSpan={9}>
                                  <AbsenceReviewEditor
                                    submissionId={submissionId}
                                    participantName={String(
                                      submission.data.fullName ?? "Participante"
                                    )}
                                    participantJustification={String(
                                      submission.data.justification ?? ""
                                    )}
                                    participantAttachment={getSubmissionAttachment(submission.data)}
                                    initialReview={submission.absenceReview}
                                    onSaved={(review) => handleReviewSaved(submissionId, review)}
                                    onCancel={() => setExpandedId(null)}
                                  />
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  ))
                : filtered.map((submission) => {
                    const isAbsence = submission.data.attendance === "no";
                    const submissionId = submission._id ?? "";
                    const isExpanded = expandedId === submissionId;

                    return (
                      <Fragment key={submission._id}>
                        <tr className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">
                            <SubmissionParticipantName data={submission.data} />
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {getSubmissionGeneration(submission.data)}
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {formatSubmissionPhone(submission.data.phone)}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {String(submission.data.email ?? "—")}
                          </td>
                          <td className="px-4 py-3">
                            <AttendanceBadge value={submission.data.attendance} />
                          </td>
                          <td className="max-w-xs px-4 py-3 text-muted">
                            {isAbsence ? (
                              <SubmissionJustificationCell data={submission.data} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isAbsence ? (
                              <AbsenceReviewBadge review={submission.absenceReview} />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {formatSubmissionDate(submission.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isAbsence && submissionId ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedId(isExpanded ? null : submissionId)}
                              >
                                {isExpanded ? "Cerrar" : "Gestionar"}
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                        {isAbsence && isExpanded && submissionId ? (
                          <tr className="border-b border-border bg-background-muted/20">
                            <td className="px-4 py-4" colSpan={9}>
                              <AbsenceReviewEditor
                                submissionId={submissionId}
                                participantName={String(submission.data.fullName ?? "Participante")}
                                participantJustification={String(submission.data.justification ?? "")}
                                participantAttachment={getSubmissionAttachment(submission.data)}
                                initialReview={submission.absenceReview}
                                onSaved={(review) => handleReviewSaved(submissionId, review)}
                                onCancel={() => setExpandedId(null)}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      ) : null}
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}

function SubmissionParticipantName({ data }: { data: Record<string, unknown> }) {
  const isSelfRegistered = String(data.registrationMode ?? "") === "manual";

  return (
    <div className="flex flex-col gap-1">
      <span>{String(data.fullName ?? "—")}</span>
      {isSelfRegistered ? (
        <Badge variant="info" className="w-fit text-xs font-normal">
          Auto-registro · Otros
        </Badge>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "admin-form-detail__chip-tab admin-form-detail__chip-tab--active"
          : "admin-form-detail__chip-tab"
      }
    >
      {children}
    </button>
  );
}

function AttendanceBadge({ value }: { value: unknown }) {
  if (value === "yes") return <Badge variant="success">Asistirá</Badge>;
  if (value === "no") return <Badge variant="warning">No asistirá</Badge>;
  return <Badge variant="neutral">Sin definir</Badge>;
}

function AbsenceReviewBadge({ review }: { review?: ExperienceFormAbsenceReview }) {
  const status = review?.status ?? "pending";
  if (status === "approved") return <Badge variant="success">Fuerza mayor aceptada</Badge>;
  if (status === "rejected") return <Badge variant="error">No procede</Badge>;
  return <Badge variant="neutral">{absenceReviewStatusLabel(status)}</Badge>;
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
