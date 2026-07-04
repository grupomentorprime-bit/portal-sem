"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { TestimonialReviewEditor } from "@/components/admin/forms/TestimonialReviewEditor";
import { SubmissionJustificationCell } from "@/components/admin/forms/SubmissionJustificationCell";
import {
  AdminDataTable,
  ColumnActions,
  Drawer,
  EmptyState,
  FilterBar,
  LoadingState,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Button } from "@/components/ui/button";
import {
  ABSENCE_REVIEW_POLICY,
  absenceReviewStatusLabel,
  formatSubmissionPhone,
  getSubmissionGeneration,
  isTestimonialSubmissionForm,
  testimonialReviewStatusLabel,
} from "@/lib/admin/forms-center";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormSubmission,
  ExperienceFormTestimonialReview,
} from "@/types/experience-forms";
import { Alert } from "@/components/ui";

export interface ExperienceFormSubmissionsTableProps {
  formId?: string;
  submissions: ExperienceFormSubmission[];
  total: number;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onDelete?: (submissionId: string, participantName: string) => Promise<void>;
  onReviewSaved?: (submissionId: string, review: ExperienceFormAbsenceReview) => void;
  onTestimonialReviewSaved?: (submissionId: string, review: ExperienceFormTestimonialReview) => void;
  absenceReviewSaveEndpoint?: (submissionId: string) => string;
}

export function ExperienceFormSubmissionsTable({
  formId,
  submissions,
  total,
  loading = false,
  error,
  onRefresh,
  onDelete,
  onReviewSaved,
  onTestimonialReviewSaved,
  absenceReviewSaveEndpoint,
}: ExperienceFormSubmissionsTableProps) {
  const [generationFilter, setGenerationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewSubmission, setReviewSubmission] = useState<ExperienceFormSubmission | null>(null);
  const [testimonialSubmission, setTestimonialSubmission] = useState<ExperienceFormSubmission | null>(
    null
  );
  const { confirm, dialog } = useConfirmDialog();

  const isTestimonialForm = Boolean(formId && isTestimonialSubmissionForm(formId));

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      if (generationFilter !== "all" && getSubmissionGeneration(submission.data) !== generationFilter) {
        return false;
      }
      if (!query) return true;
      const name = String(submission.data.fullName ?? submission.data.name ?? "").toLowerCase();
      const email = String(submission.data.email ?? "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [submissions, generationFilter, search]);

  const handleDelete = async (submission: ExperienceFormSubmission) => {
    if (!onDelete || !submission._id) return;
    const name = String(submission.data.fullName ?? submission.data.name ?? "Participante");
    const ok = await confirm({
      title: "Eliminar respuesta",
      description: `¿Eliminar la respuesta de ${name}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    await onDelete(submission._id, name);
  };

  const columns: AdminDataTableColumn<ExperienceFormSubmission>[] = [
    {
      id: "name",
      header: "Nombre",
      cell: (submission) => (
        <span className="font-medium">
          {String(submission.data.fullName ?? submission.data.name ?? "Participante")}
        </span>
      ),
    },
    ...(hasGeneration
      ? [
          {
            id: "generation",
            header: "Generación",
            cell: (submission: ExperienceFormSubmission) => (
              <span className="text-muted">{getSubmissionGeneration(submission.data)}</span>
            ),
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
        ]
      : []),
    ...(hasAttendance
      ? [
          {
            id: "phone",
            header: "Teléfono",
            cell: (submission: ExperienceFormSubmission) => (
              <span className="text-muted whitespace-nowrap">
                {formatSubmissionPhone(submission.data.phone)}
              </span>
            ),
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
        ]
      : []),
    {
      id: "email",
      header: "Correo",
      cell: (submission) => (
        <span className="text-muted">{String(submission.data.email ?? "—")}</span>
      ),
    },
    ...(hasAttendance
      ? [
          {
            id: "attendance",
            header: "Asistencia",
            cell: (submission: ExperienceFormSubmission) => {
              const value = submission.data.attendance;
              if (value === "yes") return <StatusBadge tone="active" label="Asistirá" />;
              if (value === "no") return <StatusBadge tone="pending" label="No asistirá" />;
              return <StatusBadge tone="neutral" label="Sin definir" />;
            },
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
          {
            id: "review",
            header: "Gestión",
            cell: (submission: ExperienceFormSubmission) => {
              if (submission.data.attendance !== "no") return <span className="text-muted">—</span>;
              const status = submission.absenceReview?.status ?? "pending";
              const tone =
                status === "approved" ? "active" : status === "rejected" ? "error" : "pending";
              return (
                <StatusBadge tone={tone} label={absenceReviewStatusLabel(status)} />
              );
            },
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
        ]
      : []),
    ...(isTestimonialForm
      ? [
          {
            id: "testimonialReview",
            header: "Revisión",
            cell: (submission: ExperienceFormSubmission) => {
              const status = submission.testimonialReview?.status ?? "pending";
              const tone =
                status === "published" || status === "approved"
                  ? "active"
                  : status === "rejected"
                    ? "error"
                    : "pending";
              return <StatusBadge tone={tone} label={testimonialReviewStatusLabel(status)} />;
            },
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
        ]
      : []),
    {
      id: "date",
      header: "Fecha",
      cell: (submission) => (
        <span className="text-muted whitespace-nowrap">{formatDate(submission.createdAt)}</span>
      ),
    },
  ];

  if (loading) return <LoadingState variant="table" />;

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="Sin respuestas"
        description="Aún no hay respuestas para este formulario."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {filtered.length} de {total} respuesta{total === 1 ? "" : "s"}
        </p>
        {onRefresh ? (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            Actualizar
          </Button>
        ) : null}
      </div>

      {hasAttendance && absenceCount > 0 ? (
        <Alert variant="info">{ABSENCE_REVIEW_POLICY}</Alert>
      ) : null}

      {isTestimonialForm ? (
        <Alert variant="info">
          Revisa cada testimonio, elige qué datos se publican y usa «Publicar en Home» para llevarlo al
          carrusel. Los límites de caracteres coinciden con el diseño del sitio.
        </Alert>
      ) : null}

      <FilterBar
        search={{
          placeholder: "Buscar por nombre o correo…",
          value: search,
          onChange: setSearch,
        }}
        filters={
          hasGeneration ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={generationFilter === "all" ? "primary" : "outline"}
                onClick={() => setGenerationFilter("all")}
              >
                Todas ({submissions.length})
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
          ) : undefined
        }
        onReset={
          search || generationFilter !== "all"
            ? () => {
                setSearch("");
                setGenerationFilter("all");
              }
            : undefined
        }
      />

      <AdminDataTable
        columns={columns}
        data={filtered}
        rowKey={(submission) => submission._id ?? submission.createdAt}
        emptyTitle="Sin resultados"
        emptyDescription="Prueba con otros términos o filtros."
        rowActions={(submission) => {
          const isAbsence = submission.data.attendance === "no";
          const submissionId = submission._id ?? "";
          return (
            <ColumnActions>
              {hasAttendance && isAbsence && submissionId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewSubmission(submission)}
                >
                  Gestionar
                </Button>
              ) : null}
              {isTestimonialForm && submissionId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestimonialSubmission(submission)}
                >
                  Revisar
                </Button>
              ) : null}
              {onDelete && submissionId ? (
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(submission)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : null}
            </ColumnActions>
          );
        }}
      />

      <Drawer
        open={Boolean(reviewSubmission)}
        onClose={() => setReviewSubmission(null)}
        title="Gestión de inasistencia"
      >
        {reviewSubmission?._id ? (
          <AbsenceReviewEditor
            submissionId={reviewSubmission._id}
            participantName={String(
              reviewSubmission.data.fullName ?? reviewSubmission.data.name ?? "Participante"
            )}
            participantJustification={String(
              reviewSubmission.data.justification ?? reviewSubmission.data.reason ?? ""
            )}
            participantAttachment={getSubmissionAttachment(reviewSubmission.data)}
            initialReview={reviewSubmission.absenceReview}
            saveEndpoint={
              absenceReviewSaveEndpoint?.(reviewSubmission._id) ??
              `/api/experience/forms/submissions/${reviewSubmission._id}`
            }
            onSaved={(review) => {
              if (reviewSubmission._id) {
                onReviewSaved?.(reviewSubmission._id, review);
              }
              setReviewSubmission(null);
            }}
            onCancel={() => setReviewSubmission(null)}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(testimonialSubmission)}
        onClose={() => setTestimonialSubmission(null)}
        title="Revisión de testimonio"
      >
        {testimonialSubmission ? (
          <TestimonialReviewEditor
            submission={testimonialSubmission}
            onSaved={(review) => {
              if (testimonialSubmission._id) {
                onTestimonialReviewSaved?.(testimonialSubmission._id, review);
              }
              setTestimonialSubmission(null);
            }}
            onCancel={() => setTestimonialSubmission(null)}
          />
        ) : null}
      </Drawer>

      {dialog}
    </div>
  );
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
