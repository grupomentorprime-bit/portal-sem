"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { SubmissionJustificationCell } from "@/components/admin/forms/SubmissionJustificationCell";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Alert, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  ABSENCE_REVIEW_POLICY,
  absenceReviewStatusLabel,
  attendanceLabel,
  formatSubmissionPhone,
  getSubmissionGeneration,
} from "@/lib/admin/forms-center";
import type { ExperienceFormAbsenceReview, ExperienceFormSubmission } from "@/types/experience-forms";

interface FormSubmissionsPanelProps {
  formId: string;
}

export function FormSubmissionsPanel({ formId }: FormSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generationFilter, setGenerationFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/experience/forms/submissions?formId=${encodeURIComponent(formId)}&limit=200`
      );
      const data = await res.json();
      if (!data.ok) {
        setError("No se pudieron cargar las respuestas.");
        return;
      }
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReviewSaved = (submissionId: string, review: ExperienceFormAbsenceReview) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId ? { ...submission, absenceReview: review } : submission
      )
    );
    setExpandedId(null);
  };

  const handleDelete = async (submissionId: string, participantName: string) => {
    const confirmed = window.confirm(
      `¿Eliminar la respuesta de ${participantName}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(submissionId);
    setError(null);
    try {
      const res = await fetch(`/api/experience/forms/submissions/${encodeURIComponent(submissionId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "No se pudo eliminar la respuesta.");
        return;
      }

      setSubmissions((current) => current.filter((submission) => submission._id !== submissionId));
      setTotal((current) => Math.max(0, current - 1));
      if (expandedId === submissionId) setExpandedId(null);
    } catch {
      setError("Error de red al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  const generationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const submission of submissions) {
      const generation = getSubmissionGeneration(submission.data);
      if (generation === "—") continue;
      counts.set(generation, (counts.get(generation) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [submissions]);

  const hasAttendance = useMemo(
    () => submissions.some((submission) => submission.data.attendance !== undefined),
    [submissions]
  );
  const hasGeneration = generationOptions.length > 0;
  const absenceCount = useMemo(
    () => submissions.filter((submission) => submission.data.attendance === "no").length,
    [submissions]
  );
  const columnCount = hasAttendance ? (hasGeneration ? 9 : 8) : hasGeneration ? 5 : 4;

  const visibleSubmissions = useMemo(
    () =>
      submissions.filter((submission) => {
        if (generationFilter === "all") return true;
        return getSubmissionGeneration(submission.data) === generationFilter;
      }),
    [submissions, generationFilter]
  );

  const groupedByGeneration = useMemo(() => {
    if (generationFilter !== "all" || !hasGeneration) return null;
    const groups = new Map<string, ExperienceFormSubmission[]>();
    for (const submission of visibleSubmissions) {
      const generation = getSubmissionGeneration(submission.data);
      const bucket = groups.get(generation) ?? [];
      bucket.push(submission);
      groups.set(generation, bucket);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [visibleSubmissions, generationFilter, hasGeneration]);

  if (loading) return <p className="text-sm text-muted">Cargando respuestas…</p>;

  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Aún no hay respuestas para este formulario.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {visibleSubmissions.length} de {total} respuesta{total === 1 ? "" : "s"} visible
          {total === 1 ? "" : "s"}
        </p>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      {hasAttendance && absenceCount > 0 ? (
        <Alert variant="info">{ABSENCE_REVIEW_POLICY}</Alert>
      ) : null}

      {hasGeneration ? (
        <section className="flex flex-wrap gap-2">
          <FilterChip
            active={generationFilter === "all"}
            onClick={() => setGenerationFilter("all")}
          >
            Todas las generaciones ({submissions.length})
          </FilterChip>
          {generationOptions.map(([generation, count]) => (
            <FilterChip
              key={generation}
              active={generationFilter === generation}
              onClick={() => setGenerationFilter(generation)}
            >
              {generation} ({count})
            </FilterChip>
          ))}
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-border bg-background-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              {hasGeneration ? <th className="px-4 py-3 font-medium">Generación</th> : null}
              {hasAttendance ? <th className="px-4 py-3 font-medium">Teléfono</th> : null}
              <th className="px-4 py-3 font-medium">Correo</th>
              {hasAttendance ? <th className="px-4 py-3 font-medium">Asistencia</th> : null}
              {hasAttendance ? <th className="px-4 py-3 font-medium">Justificación</th> : null}
              {hasAttendance ? <th className="px-4 py-3 font-medium">Gestión</th> : null}
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {groupedByGeneration
              ? groupedByGeneration.map(([generation, groupSubmissions]) => (
                  <Fragment key={generation}>
                    <tr className="border-b border-border bg-background-muted/40">
                      <td
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted"
                        colSpan={columnCount}
                      >
                        {generation} · {groupSubmissions.length} respuesta
                        {groupSubmissions.length === 1 ? "" : "s"}
                      </td>
                    </tr>
                    {groupSubmissions.map((submission) =>
                      renderSubmissionRow({
                        submission,
                        hasAttendance,
                        hasGeneration,
                        columnCount,
                        expandedId,
                        setExpandedId,
                        onReviewSaved: handleReviewSaved,
                        onDelete: handleDelete,
                        deletingId,
                      })
                    )}
                  </Fragment>
                ))
              : visibleSubmissions.map((submission) =>
                  renderSubmissionRow({
                    submission,
                    hasAttendance,
                    hasGeneration,
                    columnCount,
                    expandedId,
                    setExpandedId,
                    onReviewSaved: handleReviewSaved,
                    onDelete: handleDelete,
                    deletingId,
                  })
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderSubmissionRow({
  submission,
  hasAttendance,
  hasGeneration,
  columnCount,
  expandedId,
  setExpandedId,
  onReviewSaved,
  onDelete,
  deletingId,
}: {
  submission: ExperienceFormSubmission;
  hasAttendance: boolean;
  hasGeneration: boolean;
  columnCount: number;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onReviewSaved: (submissionId: string, review: ExperienceFormAbsenceReview) => void;
  onDelete: (submissionId: string, participantName: string) => void;
  deletingId: string | null;
}) {
  const isAbsence = submission.data.attendance === "no";
  const submissionId = submission._id ?? "";
  const isExpanded = expandedId === submissionId;
  const participantName = String(submission.data.fullName ?? submission.data.name ?? "Participante");
  const isDeleting = deletingId === submissionId;

  return (
    <Fragment key={submission._id}>
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-3 font-medium">{participantName}</td>
        {hasGeneration ? (
          <td className="px-4 py-3 text-muted">{getSubmissionGeneration(submission.data)}</td>
        ) : null}
        {hasAttendance ? (
          <td className="px-4 py-3 text-muted whitespace-nowrap">
            {formatSubmissionPhone(submission.data.phone)}
          </td>
        ) : null}
        <td className="px-4 py-3 text-muted">{String(submission.data.email ?? "—")}</td>
        {hasAttendance ? (
          <td className="px-4 py-3">
            {submission.data.attendance === "yes" ? (
              <Badge variant="success">{attendanceLabel(submission.data.attendance)}</Badge>
            ) : submission.data.attendance === "no" ? (
              <Badge variant="warning">{attendanceLabel(submission.data.attendance)}</Badge>
            ) : (
              <span className="text-muted">—</span>
            )}
          </td>
        ) : null}
        {hasAttendance ? (
          <td className="max-w-xs px-4 py-3 text-muted">
            {isAbsence ? <SubmissionJustificationCell data={submission.data} /> : "—"}
          </td>
        ) : null}
        {hasAttendance ? (
          <td className="px-4 py-3">
            {isAbsence ? (
              <AbsenceReviewBadge review={submission.absenceReview} />
            ) : (
              <span className="text-muted">—</span>
            )}
          </td>
        ) : null}
        <td className="px-4 py-3 text-muted whitespace-nowrap">
          {formatDate(submission.createdAt)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {hasAttendance && isAbsence && submissionId ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(isExpanded ? null : submissionId)}
                disabled={isDeleting}
              >
                {isExpanded ? "Cerrar" : "Gestionar"}
              </Button>
            ) : null}
            {submissionId ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
                loading={isDeleting}
                disabled={isDeleting}
                onClick={() => onDelete(submissionId, participantName)}
                aria-label={`Eliminar respuesta de ${participantName}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sr-only">Eliminar</span>
              </Button>
            ) : null}
          </div>
        </td>
      </tr>
      {isAbsence && isExpanded && submissionId ? (
        <tr className="border-b border-border bg-background-muted/20">
          <td className="px-4 py-4" colSpan={columnCount}>
            <AbsenceReviewEditor
              submissionId={submissionId}
              participantName={String(
                submission.data.fullName ?? submission.data.name ?? "Participante"
              )}
              participantJustification={String(submission.data.justification ?? "")}
              participantAttachment={getSubmissionAttachment(submission.data)}
              initialReview={submission.absenceReview}
              onSaved={(review) => onReviewSaved(submissionId, review)}
              onCancel={() => setExpandedId(null)}
            />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function FilterChip({
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

function AbsenceReviewBadge({ review }: { review?: ExperienceFormAbsenceReview }) {
  const status = review?.status ?? "pending";
  if (status === "approved") return <Badge variant="success">Fuerza mayor aceptada</Badge>;
  if (status === "rejected") return <Badge variant="error">No procede</Badge>;
  return <Badge variant="neutral">{absenceReviewStatusLabel(status)}</Badge>;
}

function formatDate(iso: string): string {
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
