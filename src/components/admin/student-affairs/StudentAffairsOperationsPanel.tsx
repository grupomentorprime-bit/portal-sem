"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { SubmissionJustificationCell } from "@/components/admin/forms/SubmissionJustificationCell";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Alert, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ABSENCE_REVIEW_POLICY,
  absenceReviewStatusLabel,
  formatSubmissionPhone,
  getSubmissionGeneration,
} from "@/lib/admin/forms-center";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormDayCheckIn,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import { cn } from "@/lib/utils";

interface SubmissionStats {
  total: number;
  attending: number;
  notAttending: number;
  other: number;
  checkedIn: number;
}

interface StudentAffairsOperationsPanelProps {
  formId: string;
}

type AttendanceFilter = "all" | "yes" | "no" | "checked-in" | "pending-checkin";

export function StudentAffairsOperationsPanel({ formId }: StudentAffairsOperationsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttendanceFilter>("pending-checkin");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkInSavingId, setCheckInSavingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetch(`/api/student-affairs/forms/${encodeURIComponent(formId)}/submissions?limit=500`),
        fetch(`/api/student-affairs/forms/${encodeURIComponent(formId)}/submissions?stats=true`),
      ]);
      const subsData = await subsRes.json();
      const statsData = await statsRes.json();

      if (!subsData.ok || !statsData.ok) {
        setError(subsData.error ?? statsData.error ?? "No se pudieron cargar las respuestas.");
        return;
      }

      setSubmissions(subsData.submissions ?? []);
      setStats(statsData.stats ?? null);
    } catch {
      setError("Error de red al cargar respuestas.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCheckIn = async (submissionId: string, present: boolean) => {
    setCheckInSavingId(submissionId);
    setError(null);
    try {
      const res = await fetch(`/api/student-affairs/submissions/${submissionId}/check-in`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ present }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo registrar la asistencia.");
        return;
      }

      const dayCheckIn = data.submission.dayCheckIn as ExperienceFormDayCheckIn;
      setSubmissions((current) =>
        current.map((submission) =>
          submission._id === submissionId ? { ...submission, dayCheckIn } : submission
        )
      );
      setStats((current) => {
        if (!current) return current;
        const wasCheckedIn = submissions.find((s) => s._id === submissionId)?.dayCheckIn?.present;
        let checkedIn = current.checkedIn;
        if (present && !wasCheckedIn) checkedIn += 1;
        if (!present && wasCheckedIn) checkedIn = Math.max(0, checkedIn - 1);
        return { ...current, checkedIn };
      });
    } catch {
      setError("Error de red al marcar asistencia.");
    } finally {
      setCheckInSavingId(null);
    }
  };

  const handleReviewSaved = (submissionId: string, review: ExperienceFormAbsenceReview) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId ? { ...submission, absenceReview: review } : submission
      )
    );
    setExpandedId(null);
  };

  const filtered = useMemo(() => {
    return submissions.filter((submission) => {
      if (filter === "yes" && submission.data.attendance !== "yes") return false;
      if (filter === "no" && submission.data.attendance !== "no") return false;
      if (filter === "checked-in" && !submission.dayCheckIn?.present) return false;
      if (
        filter === "pending-checkin" &&
        (submission.data.attendance !== "yes" || submission.dayCheckIn?.present)
      ) {
        return false;
      }
      if (
        generationFilter !== "all" &&
        getSubmissionGeneration(submission.data) !== generationFilter
      ) {
        return false;
      }
      return true;
    });
  }, [submissions, filter, generationFilter]);

  const generationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const submission of submissions) {
      const generation = getSubmissionGeneration(submission.data);
      if (generation === "—") continue;
      counts.set(generation, (counts.get(generation) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [submissions]);

  const expectedAttendees = stats?.attending ?? 0;
  const checkedInCount = stats?.checkedIn ?? 0;
  const pendingArrival = Math.max(0, expectedAttendees - checkedInCount);
  const checkInProgress =
    expectedAttendees > 0 ? Math.round((checkedInCount / expectedAttendees) * 100) : 0;
  const showAbsenceColumns = filter === "no" || filter === "all";

  if (loading) {
    return <p className="text-sm text-muted">Cargando respuestas…</p>;
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-foreground">Sin respuestas en su alcance</p>
        <p className="mt-1 text-sm text-muted">
          Aún no hay participantes asignados a este formulario para su equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert variant="warning">{error}</Alert> : null}

      <div className="sa-ops__panel">
        {stats ? (
          <div className="sa-ops__summary">
            <div className="sa-ops__metrics">
              <Metric label="Respuestas" value={stats.total} />
              <Metric label="Confirmaron" value={stats.attending} accent="highlight" />
              <Metric label="Llegaron hoy" value={checkedInCount} accent="highlight" />
              <Metric label="Por llegar" value={pendingArrival} accent="pending" />
            </div>

            {expectedAttendees > 0 ? (
              <div>
                <div className="sa-ops__progress-label">
                  <span>
                    Llegada:{" "}
                    <strong>
                      {checkedInCount} / {expectedAttendees}
                    </strong>
                  </span>
                  <strong>{checkInProgress}%</strong>
                </div>
                <div
                  className="sa-ops__progress-track"
                  role="progressbar"
                  aria-valuenow={checkInProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="sa-ops__progress-fill"
                    style={{ width: `${checkInProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="sa-ops__controls">
          <p className="sa-ops__controls-tip">Marque el check cuando la persona llegue a la jornada.</p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={filter === "pending-checkin"} onClick={() => setFilter("pending-checkin")}>
              Por llegar ({pendingArrival})
            </FilterChip>
            <FilterChip active={filter === "checked-in"} onClick={() => setFilter("checked-in")}>
              Llegaron ({checkedInCount})
            </FilterChip>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Todos ({submissions.length})
            </FilterChip>
            {(stats?.notAttending ?? 0) > 0 ? (
              <FilterChip active={filter === "no"} onClick={() => setFilter("no")}>
                Inasistencias ({stats?.notAttending ?? 0})
              </FilterChip>
            ) : null}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void loadData()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              <span className="sr-only">Actualizar</span>
            </Button>
          </div>
        </div>

        {generationOptions.length > 1 ? (
          <div className="sa-ops__filters">
            <span className="sa-ops__filters-label">Programa</span>
            <FilterChip active={generationFilter === "all"} onClick={() => setGenerationFilter("all")}>
              Todos
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
          </div>
        ) : null}

        {(stats?.notAttending ?? 0) > 0 ? (
          <details className="sa-ops__policy">
            <summary>Política de inasistencias</summary>
            <p className="mt-2">{ABSENCE_REVIEW_POLICY}</p>
          </details>
        ) : null}

        {filtered.length === 0 ? (
          <div className="sa-ops__empty">
            <p className="text-sm font-semibold text-foreground">Nadie en esta vista</p>
            <p className="mt-1 text-sm text-muted">Prueba otro filtro o actualiza la lista.</p>
          </div>
        ) : (
          <div className="sa-ops__table-wrap">
            <table className="sa-ops__table">
              <thead>
                <tr>
                  <th>Llegó</th>
                  <th>Participante</th>
                  <th>Programa</th>
                  <th>Teléfono</th>
                  {showAbsenceColumns ? <th>Inasistencia</th> : null}
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((submission) => {
                  const submissionId = submission._id ?? "";
                  const participantName = String(
                    submission.data.name ?? submission.data.fullName ?? "—"
                  );
                  const email = String(submission.data.email ?? "").trim();
                  const isExpanded = expandedId === submissionId;
                  const isSaving = checkInSavingId === submissionId;
                  const checkedIn = Boolean(submission.dayCheckIn?.present);
                  const rsvpYes = submission.data.attendance === "yes";
                  const rsvpNo = submission.data.attendance === "no";

                  return (
                    <Fragment key={submissionId}>
                      <tr className={cn(checkedIn && "sa-ops__row--arrived")}>
                        <td className="text-center">
                          <Checkbox
                            checked={checkedIn}
                            disabled={isSaving || !rsvpYes}
                            onChange={(event) => {
                              void handleCheckIn(submissionId, event.target.checked);
                            }}
                            aria-label={`Marcar llegada de ${participantName}`}
                          />
                        </td>
                        <td>
                          <p className="sa-ops__participant-name">{participantName}</p>
                          <div className="sa-ops__participant-meta">
                            <StatusPill
                              checkedIn={checkedIn}
                              isSaving={isSaving}
                              rsvpYes={rsvpYes}
                              rsvpNo={rsvpNo}
                            />
                            {email ? (
                              <span className="sa-ops__participant-email">{email}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="text-muted">{getSubmissionGeneration(submission.data)}</td>
                        <td className="whitespace-nowrap text-muted">
                          {formatSubmissionPhone(submission.data.phone)}
                        </td>
                        {showAbsenceColumns ? (
                          <td className="max-w-xs">
                            {rsvpNo ? (
                              <div className="space-y-2">
                                <SubmissionJustificationCell data={submission.data} />
                                <div className="flex flex-wrap items-center gap-2">
                                  <AbsenceReviewBadge review={submission.absenceReview} />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setExpandedId(isExpanded ? null : submissionId)}
                                  >
                                    {isExpanded ? "Cerrar" : "Gestionar"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        ) : null}
                        <td className="whitespace-nowrap text-muted">
                          {formatSubmissionDate(submission.createdAt)}
                        </td>
                      </tr>
                      {isExpanded && rsvpNo ? (
                        <tr className="bg-muted/20">
                          <td colSpan={showAbsenceColumns ? 6 : 5} className="px-4 py-4">
                            <AbsenceReviewEditor
                              submissionId={submissionId}
                              participantName={participantName}
                              participantJustification={String(
                                submission.data.justification ?? submission.data.reason ?? ""
                              )}
                              participantAttachment={getSubmissionAttachment(submission.data)}
                              initialReview={submission.absenceReview}
                              saveEndpoint={`/api/student-affairs/submissions/${submissionId}/absence-review`}
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
        )}

        <p className="sa-ops__footer">
          {filtered.length} participante{filtered.length === 1 ? "" : "s"} en esta vista
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "highlight" | "pending";
}) {
  return (
    <div
      className={cn(
        accent === "highlight" && "sa-ops__metric--highlight",
        accent === "pending" && "sa-ops__metric--pending"
      )}
    >
      <p className="sa-ops__metric-value">{value}</p>
      <p className="sa-ops__metric-label">{label}</p>
    </div>
  );
}

function StatusPill({
  checkedIn,
  isSaving,
  rsvpYes,
  rsvpNo,
}: {
  checkedIn: boolean;
  isSaving: boolean;
  rsvpYes: boolean;
  rsvpNo: boolean;
}) {
  if (rsvpYes) {
    return (
      <span
        className={cn(
          "sa-ops__pill",
          checkedIn ? "sa-ops__pill--arrived" : "sa-ops__pill--pending"
        )}
      >
        {checkedIn ? "Llegó" : isSaving ? "Guardando…" : "Por llegar"}
      </span>
    );
  }
  if (rsvpNo) return <Badge variant="warning">No asistirá</Badge>;
  return <span className="sa-ops__pill sa-ops__pill--neutral">Sin respuesta</span>;
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
      className={cn("sa-ops__chip", active && "sa-ops__chip--active")}
    >
      {children}
    </button>
  );
}

function AbsenceReviewBadge({ review }: { review?: ExperienceFormAbsenceReview }) {
  const status = review?.status ?? "pending";
  if (status === "approved") return <Badge variant="success">Aceptada</Badge>;
  if (status === "rejected") return <Badge variant="warning">Rechazada</Badge>;
  return <Badge variant="neutral">{absenceReviewStatusLabel(status)}</Badge>;
}

function formatSubmissionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
