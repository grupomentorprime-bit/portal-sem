"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Users } from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { SubmissionJustificationCell } from "@/components/admin/forms/SubmissionJustificationCell";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Alert, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ABSENCE_REVIEW_POLICY,
  absenceReviewStatusLabel,
  attendanceLabel,
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
  formName: string;
  formDescription?: string;
}

export function StudentAffairsOperationsPanel({
  formId,
  formName,
  formDescription,
}: StudentAffairsOperationsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "checked-in" | "pending-checkin">("all");
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

  if (loading) {
    return <p className="text-sm text-muted">Cargando respuestas…</p>;
  }

  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Aún no hay respuestas asignadas a su alcance para este formulario.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Formulario</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{formName}</h2>
            {formDescription ? <p className="mt-1 text-sm text-muted">{formDescription}</p> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={() => void loadData()}>
            Actualizar
          </Button>
        </div>

        {stats ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Respuestas" value={stats.total} />
            <StatCard icon={ClipboardCheck} label="Confirmaron asistencia" value={stats.attending} />
            <StatCard icon={CheckCircle2} label="Check-in del día" value={checkedInCount} />
            <StatCard
              icon={CheckCircle2}
              label="Pendientes de llegada"
              value={Math.max(0, expectedAttendees - checkedInCount)}
              tone="muted"
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <Alert variant="info">
        El día de la jornada, marque con el check quién llegó. Cualquier encargada con acceso puede
        registrar la asistencia desde esta tabla.
      </Alert>

      {(stats?.notAttending ?? 0) > 0 ? <Alert variant="info">{ABSENCE_REVIEW_POLICY}</Alert> : null}

      <section className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Todas ({submissions.length})
        </FilterChip>
        <FilterChip active={filter === "yes"} onClick={() => setFilter("yes")}>
          Asistirán ({stats?.attending ?? 0})
        </FilterChip>
        <FilterChip active={filter === "no"} onClick={() => setFilter("no")}>
          No asistirán ({stats?.notAttending ?? 0})
        </FilterChip>
        <FilterChip active={filter === "pending-checkin"} onClick={() => setFilter("pending-checkin")}>
          Pendientes check-in
        </FilterChip>
        <FilterChip active={filter === "checked-in"} onClick={() => setFilter("checked-in")}>
          Ya llegaron ({checkedInCount})
        </FilterChip>
      </section>

      {generationOptions.length > 0 ? (
        <section className="flex flex-wrap gap-2">
          <FilterChip active={generationFilter === "all"} onClick={() => setGenerationFilter("all")}>
            Todas las generaciones
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
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-border bg-background-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Llegó</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Generación</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">RSVP</th>
              <th className="px-4 py-3 font-medium">Justificación</th>
              <th className="px-4 py-3 font-medium">Gestión</th>
              <th className="px-4 py-3 font-medium">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((submission) => {
              const submissionId = submission._id ?? "";
              const participantName = String(submission.data.name ?? submission.data.fullName ?? "—");
              const isExpanded = expandedId === submissionId;
              const isSaving = checkInSavingId === submissionId;
              const checkedIn = Boolean(submission.dayCheckIn?.present);
              const rsvpYes = submission.data.attendance === "yes";

              return (
                <Fragment key={submissionId}>
                  <tr
                    className={cn(
                      "border-b border-border transition",
                      checkedIn ? "bg-emerald-50/60" : undefined
                    )}
                  >
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2">
                        <Checkbox
                          checked={checkedIn}
                          disabled={isSaving || !rsvpYes}
                          onChange={(event) => {
                            void handleCheckIn(submissionId, event.target.checked);
                          }}
                          aria-label={`Marcar llegada de ${participantName}`}
                        />
                        <span className="text-xs text-muted">
                          {checkedIn
                            ? submission.dayCheckIn?.checkedInByName
                              ? `Por ${submission.dayCheckIn.checkedInByName}`
                              : "Presente"
                            : rsvpYes
                              ? "Pendiente"
                              : "No aplica"}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3 font-medium">{participantName}</td>
                    <td className="px-4 py-3 text-muted">
                      {getSubmissionGeneration(submission.data)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatSubmissionPhone(submission.data.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rsvpYes ? "success" : submission.data.attendance === "no" ? "warning" : "neutral"}>
                        {attendanceLabel(String(submission.data.attendance ?? ""))}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <SubmissionJustificationCell data={submission.data} />
                    </td>
                    <td className="px-4 py-3">
                      {submission.data.attendance === "no" ? (
                        <button
                          type="button"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                          onClick={() => setExpandedId(isExpanded ? null : submissionId)}
                        >
                          {isExpanded ? "Cerrar" : "Gestionar"}
                        </button>
                      ) : (
                        <AbsenceReviewBadge review={submission.absenceReview} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(submission.createdAt).toLocaleString("es-CL")}
                    </td>
                  </tr>
                  {isExpanded && submission.data.attendance === "no" ? (
                    <tr className="border-b border-border bg-background-muted/20">
                      <td colSpan={8} className="px-4 py-4">
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

      <p className="text-xs text-muted">
        Mostrando {filtered.length} de {submissions.length} respuestas en su alcance.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "muted";
}) {
  return (
    <div className="rounded-lg border border-border bg-background-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("mt-1 text-2xl font-semibold", tone === "muted" ? "text-muted" : "text-foreground")}>
        {value}
      </p>
    </div>
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
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary bg-primary text-text-inverse"
          : "border-border bg-background text-muted hover:text-foreground"
      )}
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
