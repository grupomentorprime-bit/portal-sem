"use client";

import "@/styles/admin-student-affairs-jornada.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import {
  AdminDataTable,
  AlertBanner,
  ColumnActions,
  Drawer,
  EmptyState,
  LoadingState,
  SearchBar,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { Select } from "@/components/ui/select";
import {
  ABSENCE_REVIEW_POLICY,
  absenceReviewStatusLabel,
  formatSubmissionPhone,
  getSubmissionGeneration,
} from "@/lib/admin/forms-center";
import {
  CONVOCATORIA_GENERATIONS,
  formatGenerationDisplay,
  normalizeGenerationValue,
} from "@/lib/experience/forms/generations";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormDayCheckIn,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import type { CohortRosterStat } from "@/lib/student-affairs/cohort-stats";
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

type EventDayAction =
  | "check-in"
  | "undo-check-in"
  | "mark-absent"
  | "mark-arrived-from-absence";

interface CohortTotals {
  nominated: number;
  confirmed: number;
  pct: number;
}

export function StudentAffairsOperationsPanel({ formId }: StudentAffairsOperationsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [cohortStats, setCohortStats] = useState<CohortRosterStat[]>([]);
  const [cohortTotals, setCohortTotals] = useState<CohortTotals | null>(null);
  const [hasRoster, setHasRoster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkInSavingId, setCheckInSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canDeleteSubmissions, setCanDeleteSubmissions] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<ExperienceFormSubmission | null>(null);
  const [reclassifySubmission, setReclassifySubmission] =
    useState<ExperienceFormSubmission | null>(null);
  const [generationSavingId, setGenerationSavingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

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
      setCohortStats(statsData.cohortStats ?? []);
      setCohortTotals(statsData.cohortTotals ?? null);
      setHasRoster(Boolean(statsData.hasRoster));
      setCanDeleteSubmissions(Boolean(subsData.canDeleteSubmissions));
    } catch {
      setError("Error de red al cargar respuestas.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEventDay = async (
    submissionId: string,
    action: EventDayAction,
    notes?: string
  ) => {
    setCheckInSavingId(submissionId);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submissionId)}/event-day`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, notes, notifyParticipant: true }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo actualizar el estado.");
        return;
      }

      const updated = data.submission as ExperienceFormSubmission;
      setSubmissions((current) =>
        current.map((submission) =>
          submission._id === submissionId
            ? {
                ...submission,
                data: updated.data,
                dayCheckIn: updated.dayCheckIn,
                absenceReview: updated.absenceReview,
              }
            : submission
        )
      );

      if (data.email && !data.email.sent) {
        setError(
          `Estado actualizado, pero el correo al participante no se envió: ${data.email.reason}`
        );
      }

      void loadData();
    } catch {
      setError("Error de red al actualizar el estado.");
    } finally {
      setCheckInSavingId(null);
    }
  };

  const handleCheckIn = async (submissionId: string, present: boolean) => {
    await handleEventDay(submissionId, present ? "check-in" : "undo-check-in");
  };

  const handleMarkAbsent = async (submissionId: string, participantName: string) => {
    const confirmed = await confirm({
      title: "Marcar inasistencia",
      description: `${participantName} confirmó asistencia pero no llegó. Se cambiará a justificado y se enviará un correo para que complete su justificación con respaldo documental.`,
      confirmLabel: "Marcar inasistencia",
      destructive: true,
    });
    if (!confirmed) return;
    await handleEventDay(submissionId, "mark-absent");
  };

  const handleMarkArrivedFromAbsence = async (
    submissionId: string,
    participantName: string
  ) => {
    const confirmed = await confirm({
      title: "Cambiar condición de justificado",
      description: `${participantName} está marcado/a como Justificado. Para registrar su llegada debes cambiar esa condición: pasará a asistencia confirmada, se registrará su llegada y se enviará el correo de bienvenida.`,
      confirmLabel: "Cambiar condición y registrar",
    });
    if (!confirmed) return;
    await handleEventDay(submissionId, "mark-arrived-from-absence");
  };

  const handleReviewSaved = (submissionId: string, review: ExperienceFormAbsenceReview) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId ? { ...submission, absenceReview: review } : submission
      )
    );
    setReviewSubmission(null);
    void loadData();
  };

  const handleGenerationSaved = (submissionId: string, generation: string) => {
    setSubmissions((current) =>
      current.map((submission) =>
        submission._id === submissionId
          ? {
              ...submission,
              data: { ...submission.data, generation, program: generation },
            }
          : submission
      )
    );
    setReclassifySubmission(null);
    void loadData();
  };

  const handleDelete = async (submissionId: string, participantName: string) => {
    const confirmed = await confirm({
      title: "Eliminar registro",
      description: `¿Eliminar el registro de ${participantName}? La persona podrá volver a responder el formulario. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!confirmed) return;

    setDeletingId(submissionId);
    setError(null);
    try {
      const res = await fetch(`/api/student-affairs/submissions/${encodeURIComponent(submissionId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "No se pudo eliminar el registro.");
        return;
      }

      const removed = submissions.find((submission) => submission._id === submissionId);
      setSubmissions((current) => current.filter((submission) => submission._id !== submissionId));
      if (reviewSubmission?._id === submissionId) setReviewSubmission(null);

      if (removed && stats) {
        const wasCheckedIn = Boolean(removed.dayCheckIn?.present);
        const attendance = removed.data.attendance;
        setStats({
          total: Math.max(0, stats.total - 1),
          attending: Math.max(0, stats.attending - (attendance === "yes" ? 1 : 0)),
          notAttending: Math.max(0, stats.notAttending - (attendance === "no" ? 1 : 0)),
          other: Math.max(
            0,
            stats.other - (attendance !== "yes" && attendance !== "no" ? 1 : 0)
          ),
          checkedIn: Math.max(0, stats.checkedIn - (wasCheckedIn ? 1 : 0)),
        });
      }
    } catch {
      setError("Error de red al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  const cohortCards = useMemo(() => {
    return cohortStats.map((cohort) => ({
      ...cohort,
      shortLabel: shortProgramLabel(cohort.generation),
    }));
  }, [cohortStats]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
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
      if (query) {
        const name = String(submission.data.name ?? submission.data.fullName ?? "").toLowerCase();
        const email = String(submission.data.email ?? "").toLowerCase();
        if (!name.includes(query) && !email.includes(query)) return false;
      }
      return true;
    });
  }, [submissions, filter, generationFilter, search]);

  const expectedAttendees = stats?.attending ?? 0;
  const checkedInCount = stats?.checkedIn ?? 0;
  const pendingArrival = Math.max(0, expectedAttendees - checkedInCount);
  const arrivalPct =
    expectedAttendees > 0 ? Math.round((checkedInCount / expectedAttendees) * 100) : 0;
  const hasActiveFilters =
    filter !== "all" || generationFilter !== "all" || search.trim().length > 0;

  if (loading) {
    return <LoadingState variant="table" />;
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Sin respuestas en su alcance"
        description="Aún no hay participantes asignados a este formulario para su equipo."
      />
    );
  }

  const columns: AdminDataTableColumn<ExperienceFormSubmission>[] = [
    {
      id: "checkin",
      header: "Llegó",
      headerClassName: "w-14 text-center",
      cellClassName: "text-center",
      cell: (submission) => {
        const submissionId = submission._id ?? "";
        const rsvpYes = submission.data.attendance === "yes";
        const isSaving = checkInSavingId === submissionId;
        const checkedIn = Boolean(submission.dayCheckIn?.present);
        const participantName = String(submission.data.name ?? submission.data.fullName ?? "—");
        return (
          <Checkbox
            checked={checkedIn}
            disabled={isSaving || !rsvpYes}
            onChange={(event) => {
              void handleCheckIn(submissionId, event.target.checked);
            }}
            aria-label={`Marcar llegada de ${participantName}`}
          />
        );
      },
    },
    {
      id: "participant",
      header: "Participante",
      cell: (submission) => {
        const participantName = String(submission.data.name ?? submission.data.fullName ?? "—");
        const email = String(submission.data.email ?? "").trim();
        return (
          <div className="flex items-center gap-3">
            <ParticipantAvatar name={participantName} />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{participantName}</p>
              {email ? <p className="truncate text-xs text-muted">{email}</p> : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "generation",
      header: "Generación",
      cell: (submission) => {
        const fullLabel = getSubmissionGeneration(submission.data);
        const shortLabel = shortProgramLabel(fullLabel);
        return (
          <span className="text-sm font-medium text-foreground" title={fullLabel !== "—" ? fullLabel : undefined}>
            {shortLabel}
          </span>
        );
      },
    },
    {
      id: "phone",
      header: "Teléfono",
      cell: (submission) => (
        <span className="whitespace-nowrap text-sm text-muted">
          {formatSubmissionPhone(submission.data.phone)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (submission) => {
        const isSaving = checkInSavingId === (submission._id ?? "");
        const checkedIn = Boolean(submission.dayCheckIn?.present);
        const rsvpYes = submission.data.attendance === "yes";
        const rsvpNo = submission.data.attendance === "no";
        return (
          <AttendanceStatusBadge
            checkedIn={checkedIn}
            isSaving={isSaving}
            rsvpYes={rsvpYes}
            rsvpNo={rsvpNo}
          />
        );
      },
    },
    {
      id: "registered",
      header: "Registro",
      cell: (submission) => (
        <span className="whitespace-nowrap text-sm text-muted">
          {formatSubmissionDate(submission.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="student-affairs-jornada space-y-3">
      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}

      <div className="student-affairs-jornada__layout">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[var(--admin-shadow-card)]">
            {stats ? (
              <>
                <div className="student-affairs-jornada__metrics">
                  <MetricCell label="Respondieron" value={stats.total} />
                  <MetricCell label="Confirmaron" value={stats.attending} tone="success" />
                  <MetricCell label="Justificaron" value={stats.notAttending} tone="warning" />
                  <MetricCell label="Llegaron" value={checkedInCount} tone="info" />
                  <MetricCell label="Pendientes" value={pendingArrival} tone="pending" />
                </div>
                {expectedAttendees > 0 ? (
                  <div className="student-affairs-jornada__progress-inline">
                    <span className="shrink-0 font-medium text-foreground">Avance</span>
                    <div className="student-affairs-jornada__progress-track">
                      <div
                        className="student-affairs-jornada__progress-fill"
                        style={{ width: `${arrivalPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 tabular-nums text-muted">
                      {checkedInCount}/{expectedAttendees} ({arrivalPct}%)
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="space-y-3 border-b border-border p-3 sm:p-4">
              <SearchBar
                placeholder="Buscar participante…"
                value={search}
                onChange={setSearch}
                className="student-affairs-jornada__search max-w-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <AttendanceFilterChip
                  active={filter === "all"}
                  label="Todos"
                  count={submissions.length}
                  onClick={() => setFilter("all")}
                />
                <AttendanceFilterChip
                  active={filter === "pending-checkin"}
                  label="Por llegar"
                  count={pendingArrival}
                  onClick={() => setFilter("pending-checkin")}
                />
                <AttendanceFilterChip
                  active={filter === "checked-in"}
                  label="Llegaron"
                  count={checkedInCount}
                  onClick={() => setFilter("checked-in")}
                />
                {(stats?.notAttending ?? 0) > 0 ? (
                  <AttendanceFilterChip
                    active={filter === "no"}
                    label="Justificados"
                    count={stats?.notAttending ?? 0}
                    onClick={() => setFilter("no")}
                  />
                ) : null}
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setGenerationFilter("all");
                      setSearch("");
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>

            {hasRoster && cohortCards.length > 0 ? (
              <div className="border-b border-border px-4 py-2 sm:px-5">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Por programa
                  <span className="ml-1.5 font-normal normal-case tracking-normal">
                    · confirmados / nómina oficial
                  </span>
                </p>
                <div className="student-affairs-jornada__cohorts">
                  <button
                    type="button"
                    className={cn(
                      "student-affairs-jornada__cohort",
                      generationFilter === "all" && "student-affairs-jornada__cohort--active"
                    )}
                    onClick={() => setGenerationFilter("all")}
                  >
                    <span className="student-affairs-jornada__cohort-label">Todos</span>
                    <span className="student-affairs-jornada__cohort-meta">
                      {cohortTotals
                        ? `${cohortTotals.confirmed}/${cohortTotals.nominated}`
                        : `${stats?.attending ?? 0} confirmados`}
                    </span>
                  </button>
                  {cohortCards.map((cohort) => (
                    <button
                      key={cohort.generation}
                      type="button"
                      className={cn(
                        "student-affairs-jornada__cohort",
                        generationFilter === cohort.generation &&
                          "student-affairs-jornada__cohort--active"
                      )}
                      onClick={() => setGenerationFilter(cohort.generation)}
                      title={`${cohort.generation}: ${cohort.confirmed} confirmados de ${cohort.nominated} en nómina`}
                    >
                      <span className="student-affairs-jornada__cohort-label">{cohort.shortLabel}</span>
                      <span className="student-affairs-jornada__cohort-row">
                        <span>
                          {cohort.confirmed}/{cohort.nominated}
                        </span>
                        <span>{cohort.pct}%</span>
                      </span>
                      <div className="student-affairs-jornada__cohort-bar">
                        <div
                          className="student-affairs-jornada__cohort-bar-fill"
                          style={{ width: `${cohort.pct}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="px-2 pb-2 pt-2 sm:px-4">
              {filtered.length === 0 ? (
                <EmptyState
                  title="Nadie en esta vista"
                  description="Prueba otro filtro o actualiza la lista."
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <AdminDataTable
                  columns={columns}
                  data={filtered}
                  rowKey={(submission) => submission._id ?? submission.createdAt}
                  emptyTitle="Nadie en esta vista"
                  emptyDescription="Prueba otro filtro o actualiza la lista."
                  rowActions={(submission) => {
                    const submissionId = submission._id ?? "";
                    const participantName = String(
                      submission.data.name ?? submission.data.fullName ?? "—"
                    );
                    const isSaving = checkInSavingId === submissionId;
                    const isDeleting = deletingId === submissionId;
                    const isReclassifying = generationSavingId === submissionId;
                    const checkedIn = Boolean(submission.dayCheckIn?.present);
                    const rsvpYes = submission.data.attendance === "yes";
                    const rsvpNo = submission.data.attendance === "no";
                    const menuItems = [
                      {
                        label: "Cambiar generación",
                        onClick: () => setReclassifySubmission(submission),
                        disabled: isSaving || isDeleting || isReclassifying,
                      },
                      ...(rsvpYes && !checkedIn
                        ? [
                            {
                              label: "Marcar inasistencia",
                              onClick: () =>
                                void handleMarkAbsent(submissionId, participantName),
                              disabled: isSaving || isDeleting,
                            },
                          ]
                        : []),
                      ...(rsvpNo
                        ? [
                            {
                              label: "Gestionar inasistencia",
                              onClick: () => setReviewSubmission(submission),
                            },
                            {
                              label: "Registrar llegada",
                              onClick: () =>
                                void handleMarkArrivedFromAbsence(submissionId, participantName),
                              disabled: isSaving || isDeleting,
                            },
                          ]
                        : []),
                      ...(canDeleteSubmissions
                        ? [
                            {
                              label: "Eliminar registro",
                              onClick: () => void handleDelete(submissionId, participantName),
                              disabled: isDeleting || isSaving,
                            },
                          ]
                        : []),
                    ];

                    return (
                      <ColumnActions className="justify-end gap-2">
                        {rsvpYes && !checkedIn ? (
                          <Button
                            variant="success"
                            size="sm"
                            loading={isSaving}
                            disabled={isSaving || isDeleting || isReclassifying}
                            onClick={() => void handleCheckIn(submissionId, true)}
                          >
                            Registrar llegada
                          </Button>
                        ) : null}
                        {rsvpYes && checkedIn ? (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={isSaving}
                            disabled={isSaving || isDeleting || isReclassifying}
                            onClick={() => void handleCheckIn(submissionId, false)}
                          >
                            Desmarcar llegada
                          </Button>
                        ) : null}
                        <Dropdown
                          align="right"
                          trigger={
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-background-muted">
                              <MoreVertical className="h-4 w-4" />
                            </span>
                          }
                          items={menuItems}
                        />
                      </ColumnActions>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <aside className="student-affairs-jornada__aside space-y-3">
          {stats ? (
            <div className="student-affairs-jornada__aside-card space-y-3">
              <h3 className="student-affairs-jornada__aside-title">Resumen general</h3>
              <p className="text-2xl font-bold text-foreground">{stats.attending}</p>
              <p className="text-xs text-muted">Asistentes confirmados</p>
              <div className="space-y-2 border-t border-border pt-3">
                <SummaryRow
                  dotClass="bg-[var(--color-success)]"
                  label="Llegaron"
                  value={checkedInCount}
                />
                <SummaryRow
                  dotClass="bg-[var(--color-warning)]"
                  label="Por llegar"
                  value={pendingArrival}
                />
                <SummaryRow
                  dotClass="bg-[var(--state-info-fg)]"
                  label="Justificados"
                  value={stats.notAttending}
                />
              </div>
            </div>
          ) : null}

          {hasRoster && cohortCards.length > 0 ? (
            <div className="student-affairs-jornada__aside-card space-y-3">
              <h3 className="student-affairs-jornada__aside-title">Confirmación por programa</h3>
              <p className="text-[11px] text-muted">Asistencia confirmada sobre nómina oficial</p>
              <div className="space-y-3">
                {cohortCards.map((cohort) => (
                  <div key={cohort.generation}>
                    <div className="student-affairs-jornada__stat-row">
                      <span className="truncate font-medium text-foreground">{cohort.shortLabel}</span>
                      <span className="shrink-0 text-xs text-muted">{cohort.pct}%</span>
                    </div>
                    <div className="student-affairs-jornada__cohort-bar mt-1.5">
                      <div
                        className="student-affairs-jornada__cohort-bar-fill"
                        style={{ width: `${cohort.pct}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {cohort.confirmed} confirmados / {cohort.nominated} en nómina
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(stats?.notAttending ?? 0) > 0 ? (
            <details className="student-affairs-jornada__aside-card text-sm text-muted">
              <summary className="cursor-pointer font-semibold text-primary">
                Política de inasistencias
              </summary>
              <p className="mt-2 text-xs leading-relaxed">{ABSENCE_REVIEW_POLICY}</p>
            </details>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => void loadData()}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar lista
          </Button>
        </aside>
      </div>

      <Drawer
        open={Boolean(reclassifySubmission)}
        onClose={() => setReclassifySubmission(null)}
        title="Cambiar generación"
      >
        {reclassifySubmission?._id ? (
          <GenerationReclassifyForm
            submission={reclassifySubmission}
            saving={generationSavingId === reclassifySubmission._id}
            onSavingChange={(saving) =>
              setGenerationSavingId(saving ? reclassifySubmission._id! : null)
            }
            onSaved={(generation) => handleGenerationSaved(reclassifySubmission._id!, generation)}
            onCancel={() => setReclassifySubmission(null)}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(reviewSubmission)}
        onClose={() => setReviewSubmission(null)}
        title="Gestión de inasistencia"
      >
        {reviewSubmission?._id ? (
          <AbsenceReviewEditor
            submissionId={reviewSubmission._id}
            participantName={String(
              reviewSubmission.data.name ?? reviewSubmission.data.fullName ?? "Participante"
            )}
            participantJustification={String(
              reviewSubmission.data.justification ?? reviewSubmission.data.reason ?? ""
            )}
            participantAttachment={getSubmissionAttachment(reviewSubmission.data)}
            initialReview={reviewSubmission.absenceReview}
            saveEndpoint={`/api/student-affairs/submissions/${reviewSubmission._id}/absence-review`}
            onSaved={(review) => handleReviewSaved(reviewSubmission._id!, review)}
            onCancel={() => setReviewSubmission(null)}
          />
        ) : null}
      </Drawer>

      {dialog}
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "info" | "pending";
}) {
  return (
    <div className="student-affairs-jornada__metric">
      <p
        className={cn(
          "student-affairs-jornada__metric-value",
          tone === "success" && "text-[var(--state-success-fg)]",
          tone === "warning" && "text-[var(--state-warning-fg)]",
          tone === "info" && "text-[var(--state-info-fg)]",
          tone === "pending" && "text-[var(--color-primary)]"
        )}
      >
        {value}
      </p>
      <p className="student-affairs-jornada__metric-label">{label}</p>
    </div>
  );
}

function SummaryRow({
  dotClass,
  label,
  value,
}: {
  dotClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="student-affairs-jornada__stat-row">
      <span className="flex items-center gap-2 text-muted">
        <span className={cn("student-affairs-jornada__stat-dot", dotClass)} aria-hidden />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function AttendanceFilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-text-inverse shadow-sm"
          : "bg-background-muted text-foreground hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--background-muted))]"
      )}
    >
      <span>{label}</span>
      <span className={cn("tabular-nums", active ? "text-text-inverse/85" : "text-muted")}>
        ({count})
      </span>
    </button>
  );
}

function ParticipantAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "?";
  const hue = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  return (
    <span
      className="student-affairs-jornada__participant-avatar"
      style={{ background: `hsl(${hue} 42% 42%)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function AttendanceStatusBadge({
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
    if (checkedIn) return <StatusBadge tone="active" label="Llegó" />;
    return (
      <StatusBadge
        tone="pending"
        label={isSaving ? "Guardando…" : "Por llegar"}
        className="student-affairs-jornada__status-pending"
      />
    );
  }
  if (rsvpNo) {
    return (
      <StatusBadge
        tone="info"
        label="Justificado"
        className="student-affairs-jornada__status-justified"
      />
    );
  }
  return <StatusBadge tone="neutral" label="Sin respuesta" />;
}

function GenerationReclassifyForm({
  submission,
  saving,
  onSavingChange,
  onSaved,
  onCancel,
}: {
  submission: ExperienceFormSubmission;
  saving: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: (generation: string) => void;
  onCancel: () => void;
}) {
  const participantName = String(submission.data.name ?? submission.data.fullName ?? "Participante");
  const currentGeneration =
    normalizeGenerationValue(submission.data.generation ?? submission.data.program) || "other";
  const [generation, setGeneration] = useState(currentGeneration);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!submission._id || generation === currentGeneration) {
      onCancel();
      return;
    }

    onSavingChange(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submission._id)}/generation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generation }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cambiar la generación.");
        return;
      }
      onSaved(generation);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Ajusta la generación de <strong className="text-foreground">{participantName}</strong>. Se
        actualiza la respuesta y, si está en la nómina, también el listado oficial.
      </p>
      <p className="text-xs text-muted">
        Actual: {formatGenerationDisplay(currentGeneration)}
      </p>
      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}
      <Select
        label="Nueva generación"
        value={generation}
        onChange={(event) => setGeneration(event.target.value)}
        options={CONVOCATORIA_GENERATIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" loading={saving} disabled={saving} onClick={() => void handleSubmit()}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

function shortProgramLabel(generation: string): string {
  const cohort = generation.match(/G-\d{4}/i);
  if (cohort) return cohort[0].toUpperCase();
  if (/equipo/i.test(generation)) return "Equipo";
  if (/otros/i.test(generation)) return "Otros";
  if (generation.length > 14) return `${generation.slice(0, 12)}…`;
  return generation;
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
