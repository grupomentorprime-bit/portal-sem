"use client";

import "@/styles/admin-student-affairs-jornada.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { ClipboardList, Download, RefreshCw } from "lucide-react";
import { AbsenceReviewEditor } from "@/components/admin/forms/AbsenceReviewEditor";
import { AbsenceContactDrawer } from "@/components/admin/student-affairs/AbsenceContactDrawer";
import {
  ParticipantManageDrawer,
  type ParticipantManageTarget,
} from "@/components/admin/student-affairs/ParticipantManageDrawer";
import { CloseJornadaHandoffDialog } from "@/components/admin/student-affairs/CloseJornadaHandoffDialog";
import { ValidateHandoffDialog } from "@/components/admin/student-affairs/ValidateHandoffDialog";
import { OperationsClosureRecord } from "@/components/admin/student-affairs/OperationsClosureRecord";
import {
  AdminDataTable,
  AlertBanner,
  Drawer,
  EmptyState,
  InputDialog,
  LoadingState,
  SearchBar,
  StatusBadge,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { useToast } from "@/components/admin/kit/states/Toast";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import {
  ABSENCE_REVIEW_POLICY,
  formatSubmissionPhone,
  getSubmissionGeneration,
  publicFormUrl,
} from "@/lib/admin/forms-center";
import {
  CONVOCATORIA_GENERATIONS,
  formatGenerationDisplay,
  normalizeGenerationValue,
} from "@/lib/experience/forms/generations";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import {
  CONFIRMED_NO_SHOW_LABEL,
  CONFIRMED_NO_SHOW_LABEL_SHORT,
  CONFIRMED_NO_SHOW_ROW_LABEL,
  PENDING_VALIDATION_CONTACT_LABEL,
  PENDING_VALIDATION_CONTACT_LABEL_FULL,
} from "@/lib/student-affairs/operations-labels";
import {
  absenceCategoryLabel,
  canSendJustificationRequest,
  classifyAbsenceSubmission,
  classifyPendingReviewContext,
  countAbsenceCategories,
  isPendingValidationOrContact,
  pendingReviewContextLabel,
} from "@/lib/student-affairs/absence-categories";
import { downloadOperationsCsv } from "@/lib/student-affairs/export-operations-csv";
import type { CohortRosterStat } from "@/lib/student-affairs/cohort-stats";
import { formatAbsenceContactDate } from "@/lib/student-affairs/absence-contact-labels";
import {
  getExcuseSubmissionDisplay,
  getParticipantJustificationSummary,
} from "@/lib/student-affairs/justification-display";
import { formatJustificationDeadline } from "@/lib/experience/forms/absence-justification-deadline";
import type { ConvocatoriaRosterStudent } from "@/types/convocatoria-roster";
import type {
  StudentAffairsFormOperations,
  StudentAffairsOperationsPhase,
} from "@/types/student-affairs-operations";
import {
  getHandoffValidationStatus,
  isSubmissionLockedForStudentAffairsOperator,
} from "@/lib/student-affairs/follow-up-access";
import { cn } from "@/lib/utils";

interface SubmissionStats {
  total: number;
  attending: number;
  notAttending: number;
  other: number;
  checkedIn: number;
  rosterPending?: number;
  absencePendingEmail?: number;
  absenceUnjustified?: number;
  absenceAwaitingJustification?: number;
  absencePendingReview?: number;
  absenceApproved?: number;
}

interface StudentAffairsOperationsPanelProps {
  formId: string;
  formName: string;
}

type AttendanceFilter =
  | "all"
  | "yes"
  | "no"
  | "absence-pending-action"
  | "absence-pending-email"
  | "absence-unjustified"
  | "absence-awaiting-justification"
  | "absence-pending-review"
  | "absence-pending-review-pre"
  | "absence-pending-review-post"
  | "absence-approved"
  | "absence-dropout"
  | "checked-in"
  | "pending-checkin"
  | "roster-pending"
  | "unclosed";

type EventDayAction =
  | "check-in"
  | "undo-check-in"
  | "mark-absent"
  | "mark-arrived-from-absence";

type RosterOnSiteAction = "check-in" | "mark-absent";

interface CohortTotals {
  nominated: number;
  confirmed: number;
  pct: number;
}

export function StudentAffairsOperationsPanel({ formId, formName }: StudentAffairsOperationsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [cohortStats, setCohortStats] = useState<CohortRosterStat[]>([]);
  const [cohortTotals, setCohortTotals] = useState<CohortTotals | null>(null);
  const [hasRoster, setHasRoster] = useState(false);
  const [rosterPending, setRosterPending] = useState<ConvocatoriaRosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkInSavingId, setCheckInSavingId] = useState<string | null>(null);
  const [rosterSavingId, setRosterSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canDeleteSubmissions, setCanDeleteSubmissions] = useState(false);
  const [canReclassifyGeneration, setCanReclassifyGeneration] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<ExperienceFormSubmission | null>(null);
  const [reclassifySubmission, setReclassifySubmission] =
    useState<ExperienceFormSubmission | null>(null);
  const [generationSavingId, setGenerationSavingId] = useState<string | null>(null);
  const [justificationEmailTarget, setJustificationEmailTarget] = useState<{
    submissionId: string;
    participantName: string;
    email: string;
  } | null>(null);
  const [justificationEmailSaving, setJustificationEmailSaving] = useState(false);
  const [bulkJustificationSaving, setBulkJustificationSaving] = useState(false);
  const [contactSubmission, setContactSubmission] = useState<ExperienceFormSubmission | null>(null);
  const [manageTarget, setManageTarget] = useState<ParticipantManageTarget | null>(null);
  const [operationsPhase, setOperationsPhase] =
    useState<StudentAffairsOperationsPhase>("on-site");
  const [operations, setOperations] = useState<StudentAffairsFormOperations | null>(null);
  const [canCloseOnSite, setCanCloseOnSite] = useState(false);
  const [canReopenOnSite, setCanReopenOnSite] = useState(false);
  const [canValidateHandoff, setCanValidateHandoff] = useState(false);
  const [isStudentAffairsOperator, setIsStudentAffairsOperator] = useState(false);
  const [operationsSaving, setOperationsSaving] = useState(false);
  const [closeJornadaOpen, setCloseJornadaOpen] = useState(false);
  const [validateHandoffOpen, setValidateHandoffOpen] = useState(false);
  const { confirm, dialog } = useConfirmDialog();
  const { push } = useToast();

  const onSiteClosed = operationsPhase === "follow-up";
  const handoffValidationStatus = getHandoffValidationStatus(operations);
  const handoffValidated = handoffValidationStatus === "validated";
  const handoffPendingValidation = handoffValidationStatus === "pending";

  const isSubmissionFollowUpLocked = useCallback(
    (submission: ExperienceFormSubmission) =>
      isStudentAffairsOperator &&
      isSubmissionLockedForStudentAffairsOperator(submission, operations),
    [isStudentAffairsOperator, operations]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, statsRes, opsRes] = await Promise.all([
        fetch(`/api/student-affairs/forms/${encodeURIComponent(formId)}/submissions?limit=500`),
        fetch(`/api/student-affairs/forms/${encodeURIComponent(formId)}/submissions?stats=true`),
        fetch(`/api/student-affairs/forms/${encodeURIComponent(formId)}/operations-state`),
      ]);
      const subsData = await subsRes.json();
      const statsData = await statsRes.json();
      const opsData = await opsRes.json();

      if (!subsData.ok || !statsData.ok) {
        setError(subsData.error ?? statsData.error ?? "No se pudieron cargar las respuestas.");
        return;
      }

      setSubmissions(subsData.submissions ?? []);
      setStats(statsData.stats ?? null);
      setCohortStats(statsData.cohortStats ?? []);
      setCohortTotals(statsData.cohortTotals ?? null);
      setHasRoster(Boolean(statsData.hasRoster ?? subsData.hasRoster));
      setRosterPending(subsData.rosterPending ?? statsData.rosterPending ?? []);
      setCanDeleteSubmissions(Boolean(subsData.canDeleteSubmissions));
      setCanReclassifyGeneration(Boolean(subsData.canReclassifyGeneration));

      if (opsData.ok) {
        setOperationsPhase(opsData.phase ?? "on-site");
        setOperations(opsData.operations ?? null);
        setCanCloseOnSite(Boolean(opsData.permissions?.canCloseOnSite));
        setCanReopenOnSite(Boolean(opsData.permissions?.canReopenOnSite));
        setCanValidateHandoff(Boolean(opsData.permissions?.canValidateHandoff));
        setIsStudentAffairsOperator(Boolean(opsData.permissions?.isStudentAffairsOperator));
      }
    } catch {
      setError("Error de red al cargar respuestas.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useDeferredEffect(() => {
    void loadData();
  }, [loadData]);

  const handleEventDay = async (
    submissionId: string,
    action: EventDayAction,
    options?: { notes?: string; notifyParticipant?: boolean }
  ): Promise<ExperienceFormSubmission | null> => {
    setCheckInSavingId(submissionId);
    setError(null);
    try {
      const notifyParticipant =
        options?.notifyParticipant ?? action !== "mark-absent";
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submissionId)}/event-day`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            notes: options?.notes,
            notifyParticipant,
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo actualizar el estado.");
        return null;
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
      return updated;
    } catch {
      setError("Error de red al actualizar el estado.");
      return null;
    } finally {
      setCheckInSavingId(null);
    }
  };

  const handleCheckIn = async (submissionId: string, present: boolean) => {
    await handleEventDay(submissionId, present ? "check-in" : "undo-check-in");
  };

  const openJustificationEmailDialog = (
    submission: ExperienceFormSubmission,
    participantName: string
  ) => {
    if (!submission._id || !canSendJustificationRequest(submission)) return;
    setJustificationEmailTarget({
      submissionId: submission._id,
      participantName,
      email: String(submission.data.email ?? "").trim(),
    });
  };

  const handleSendJustificationRequest = async (email: string) => {
    if (!justificationEmailTarget) return;
    setJustificationEmailSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(justificationEmailTarget.submissionId)}/justification-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar la solicitud de justificación.");
        return;
      }
      setJustificationEmailTarget(null);
      void loadData();
    } catch {
      setError("Error de red al enviar la solicitud.");
    } finally {
      setJustificationEmailSaving(false);
    }
  };

  const handleBulkSendJustificationRequests = async () => {
    const targets = submissions.filter(
      (submission) => classifyAbsenceSubmission(submission) === "pending-email"
    );
    const ready = targets
      .map((submission) => ({
        submissionId: submission._id ?? "",
        email: String(submission.data.email ?? "").trim(),
        name: String(submission.data.name ?? submission.data.fullName ?? "Participante"),
      }))
      .filter((item) => item.submissionId && item.email);

    if (ready.length === 0) {
      setError(
        "Ningún participante pendiente tiene correo registrado. Ingresa el correo en cada fila antes de enviar."
      );
      return;
    }

    const skipped = targets.length - ready.length;
    const confirmed = await confirm({
      title: "Enviar solicitudes de justificación",
      description: `Se enviará un correo a ${ready.length} participante(s). El plazo de 3 días comenzará en el momento del envío para cada uno.${
        skipped > 0
          ? ` ${skipped} participante(s) sin correo quedarán pendientes hasta que ingreses su correo.`
          : ""
      }`,
      confirmLabel: "Enviar correos",
    });
    if (!confirmed) return;

    setBulkJustificationSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/justification-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: ready.map(({ submissionId, email }) => ({ submissionId, email })),
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudieron enviar las solicitudes.");
        return;
      }
      if (data.failed?.length) {
        setError(
          `Se enviaron ${data.sent} correo(s). ${data.failed.length} no se pudieron enviar.`
        );
      }
      void loadData();
    } catch {
      setError("Error de red al enviar solicitudes.");
    } finally {
      setBulkJustificationSaving(false);
    }
  };

  const handleMarkAbsent = async (submissionId: string, participantName: string) => {
    const confirmed = await confirm({
      title: "Marcar inasistencia",
      description: `${participantName} confirmó asistencia pero no asistió. Después podrás enviarle la solicitud de justificación por correo; el plazo de 3 días comenzará al enviar el correo.`,
      confirmLabel: "Marcar inasistencia",
      destructive: true,
    });
    if (!confirmed) return;
    const updated = await handleEventDay(submissionId, "mark-absent", {
      notifyParticipant: false,
    });
    if (updated) {
      openJustificationEmailDialog(updated, participantName);
    }
  };

  const handleMarkArrivedFromAbsence = async (
    submissionId: string,
    participantName: string
  ) => {
    const confirmed = await confirm({
      title: "Cambiar condición de justificado",
      description: `${participantName} está marcado/a como Justificado. Para registrar su asistencia debes cambiar esa condición: pasará a asistencia confirmada, se marcará como asistió y se enviará el correo de bienvenida.`,
      confirmLabel: "Cambiar condición y registrar",
    });
    if (!confirmed) return;
    await handleEventDay(submissionId, "mark-arrived-from-absence");
  };

  const handleRosterOnSite = async (
    student: ConvocatoriaRosterStudent,
    action: RosterOnSiteAction
  ) => {
    const participantName = student.fullName;

    if (action === "check-in") {
      const confirmed = await confirm({
        title: "Registrar asistencia en jornada",
        description: `${participantName} está en nómina pero no completó el formulario. Se creará su confirmación de asistencia y se registrará que asistió.`,
        confirmLabel: "Registrar asistencia",
      });
      if (!confirmed) return;
    } else {
      const confirmed = await confirm({
        title: "Marcar inasistencia",
        description: `${participantName} no completó el formulario y no asistió. Después podrás enviar la solicitud de justificación por correo; el plazo de 3 días comenzará al enviar el correo.`,
        confirmLabel: "Marcar inasistencia",
        destructive: true,
      });
      if (!confirmed) return;
    }

    setRosterSavingId(student.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/roster-arrival`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            action,
            notifyParticipant: action === "check-in",
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo registrar al participante.");
        return;
      }

      if (data.email && !data.email.sent && action === "check-in") {
        setError(
          `Registro guardado, pero el correo al participante no se envió: ${data.email.reason}`
        );
      }

      if (action === "mark-absent" && data.submission) {
        openJustificationEmailDialog(data.submission as ExperienceFormSubmission, participantName);
      }

      void loadData();
    } catch {
      setError("Error de red al registrar al participante.");
    } finally {
      setRosterSavingId(null);
    }
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

  const handleContactSaved = (submission: ExperienceFormSubmission) => {
    const submissionId = submission._id ?? "";
    setSubmissions((current) =>
      current.map((item) =>
        item._id === submissionId
          ? submission
          : item
      )
    );
    setContactSubmission(null);
    void loadData();
  };

  const handleRosterUpdated = (student: ConvocatoriaRosterStudent) => {
    setRosterPending((current) =>
      current.map((item) => (item.id === student.id ? student : item))
    );
    setManageTarget((current) =>
      current?.kind === "roster" && current.student.id === student.id
        ? { kind: "roster", student }
        : current
    );
  };

  const handleSubmissionUpdated = (submission: ExperienceFormSubmission) => {
    const submissionId = submission._id ?? "";
    setSubmissions((current) =>
      current.map((item) => (item._id === submissionId ? submission : item))
    );
    setManageTarget((current) =>
      current?.kind === "submission" && current.submission._id === submissionId
        ? { kind: "submission", submission }
        : current
    );
  };

  const handleRosterJustificationSent = (submission: ExperienceFormSubmission) => {
    setManageTarget(null);
    void loadData();
    if (submission._id) {
      setSubmissions((current) => {
        const exists = current.some((item) => item._id === submission._id);
        return exists
          ? current.map((item) => (item._id === submission._id ? submission : item))
          : [...current, submission];
      });
    }
  };

  const openPhoneContact = (submission: ExperienceFormSubmission) => {
    setContactSubmission(submission);
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

  const absenceCounts = useMemo(() => {
    const fromStats =
      stats?.absenceUnjustified !== undefined
        ? {
            pendingEmail: stats.absencePendingEmail ?? 0,
            unjustified: stats.absenceUnjustified,
            awaitingJustification: stats.absenceAwaitingJustification ?? 0,
            pendingReview: stats.absencePendingReview ?? 0,
            approved: stats.absenceApproved ?? 0,
            total: stats.notAttending,
          }
        : null;
    return fromStats ?? countAbsenceCategories(submissions);
  }, [stats, submissions]);

  const dropoutCount = useMemo(
    () => submissions.filter((s) => classifyAbsenceSubmission(s) === "dropout").length,
    [submissions]
  );

  const pendingActionCount =
    (absenceCounts.pendingEmail ?? 0) + (absenceCounts.pendingReview ?? 0);

  const isSearchMode = search.trim().length > 0;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      if (!isSearchMode) {
        if (filter === "yes" && submission.data.attendance !== "yes") return false;
        if (filter === "no" && submission.data.attendance !== "no") return false;
        if (filter === "absence-pending-action") {
          if (!isPendingValidationOrContact(classifyAbsenceSubmission(submission))) return false;
        }
        if (filter === "absence-pending-email") {
          if (classifyAbsenceSubmission(submission) !== "pending-email") return false;
        }
        if (filter === "absence-unjustified" || filter === "unclosed") {
          if (classifyAbsenceSubmission(submission) !== "unjustified") return false;
        }
        if (filter === "absence-awaiting-justification") {
          if (classifyAbsenceSubmission(submission) !== "awaiting-justification") return false;
        }
        if (filter === "absence-pending-review") {
          if (classifyAbsenceSubmission(submission) !== "pending-review") return false;
        }
        if (filter === "absence-pending-review-pre") {
          if (classifyPendingReviewContext(submission) !== "pre-event") return false;
        }
        if (filter === "absence-pending-review-post") {
          if (classifyPendingReviewContext(submission) !== "post-absence") return false;
        }
        if (filter === "absence-approved") {
          if (classifyAbsenceSubmission(submission) !== "approved") return false;
        }
        if (filter === "absence-dropout") {
          if (classifyAbsenceSubmission(submission) !== "dropout") return false;
        }
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
      }

      if (query) {
        const name = String(submission.data.name ?? submission.data.fullName ?? "").toLowerCase();
        const email = String(submission.data.email ?? "").toLowerCase();
        const phone = String(submission.data.phone ?? "").toLowerCase();
        const rut = String(submission.data.rut ?? "").toLowerCase();
        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query) &&
          !rut.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, filter, generationFilter, search, isSearchMode]);

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rosterPending.filter((student) => {
      if (!isSearchMode) {
        if (filter !== "roster-pending" && filter !== "all" && filter !== "unclosed") {
          return false;
        }
        if (generationFilter !== "all") {
          const generation = formatGenerationDisplay(student.generation);
          if (generation !== generationFilter) return false;
        }
      }
      if (query) {
        const name = student.fullName.toLowerCase();
        const rut = (student.rut ?? "").toLowerCase();
        const phone = (student.phone ?? "").toLowerCase();
        const email = (student.email ?? "").toLowerCase();
        if (
          !name.includes(query) &&
          !rut.includes(query) &&
          !phone.includes(query) &&
          !email.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rosterPending, generationFilter, search, isSearchMode, filter]);

  const isRosterFilter = filter === "roster-pending";
  const isUnclosedFilter = filter === "unclosed";

  const rosterPendingCount = stats?.rosterPending ?? rosterPending.length;
  const unclosedCount =
    (absenceCounts.unjustified ?? 0) + (hasRoster ? rosterPendingCount : 0);
  const expectedAttendees = stats?.attending ?? 0;
  const checkedInCount = stats?.checkedIn ?? 0;
  const pendingArrival = Math.max(0, expectedAttendees - checkedInCount);

  const asidePendingItems = useMemo(
    () =>
      [
        {
          label: CONFIRMED_NO_SHOW_LABEL,
          value: pendingArrival,
          filter: "pending-checkin" as const,
          dotClass: "bg-[var(--color-warning)]",
        },
        {
          label: PENDING_VALIDATION_CONTACT_LABEL,
          value: pendingActionCount,
          filter: "absence-pending-action" as const,
          dotClass: "bg-[var(--state-info-fg)]",
        },
        {
          label: "Sin registrar ni justificar",
          value: unclosedCount,
          filter: "unclosed" as const,
          dotClass: "bg-[var(--state-warning)]",
        },
        {
          label: "Plazo justificación",
          value: absenceCounts.awaitingJustification,
          filter: "absence-awaiting-justification" as const,
          dotClass: "bg-[var(--color-primary)]",
        },
      ].filter((item) => item.value > 0),
    [absenceCounts, pendingActionCount, pendingArrival, unclosedCount]
  );

  const handleCloseOnSitePhase = () => {
    setCloseJornadaOpen(true);
  };

  const submitCloseOnSitePhase = async () => {
    setOperationsSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/operations-state`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close-on-site" }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cerrar la jornada.");
        return;
      }
      setOperationsPhase("follow-up");
      setOperations(data.operations ?? null);
      setCloseJornadaOpen(false);

      const pdf = await import("@/lib/student-affairs/download-handoff-report-pdf");
      const report = pdf.resolveHandoffReportForDownload(data.operations ?? null, data.report);
      if (report) {
        await pdf.downloadHandoffReportPdf({ formName, formId, report });
      }
    } catch {
      setError("Error de red al cerrar la jornada.");
    } finally {
      setOperationsSaving(false);
    }
  };

  const downloadClosurePdf = async () => {
    const { downloadHandoffReportPdf, resolveHandoffReportForDownload } = await import(
      "@/lib/student-affairs/download-handoff-report-pdf"
    );
    const baseReport = resolveHandoffReportForDownload(operations);
    if (!baseReport) return;

    const { buildHandoffNominations } = await import(
      "@/lib/student-affairs/build-handoff-nominations"
    );
    const report = {
      ...baseReport,
      nominations: buildHandoffNominations({
        submissions,
        rosterStudents: rosterPending,
      }),
      cohortStats: cohortStats.length > 0 ? cohortStats : baseReport.cohortStats,
    };

    await downloadHandoffReportPdf({ formName, formId, report });
  };

  const handleReopenOnSitePhase = async () => {
    const confirmed = await confirm({
      title: "Reabrir jornada presencial",
      description:
        "Solo el encargado de calidad puede reabrir la jornada. Volverá a habilitarse el registro de asistencia presencial.",
      confirmLabel: "Reabrir jornada",
    });
    if (!confirmed) return;

    setOperationsSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/operations-state`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reopen-on-site" }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo reabrir la jornada.");
        return;
      }
      setOperationsPhase("on-site");
      setOperations(data.operations ?? null);
    } catch {
      setError("Error de red al reabrir la jornada.");
    } finally {
      setOperationsSaving(false);
    }
  };

  const submitValidateHandoff = async () => {
    setOperationsSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/forms/${encodeURIComponent(formId)}/operations-state`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "validate-handoff" }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo validar el informe.");
        return;
      }
      setOperations(data.operations ?? null);
      setValidateHandoffOpen(false);

      const dispatch = data.dispatch as
        | {
            emailsSent?: number;
            encargadaNotifications?: number;
            qualityNotifications?: number;
            errors?: string[];
          }
        | null
        | undefined;

      if (dispatch) {
        const parts: string[] = [];
        if (dispatch.emailsSent) {
          parts.push(`${dispatch.emailsSent} correo${dispatch.emailsSent === 1 ? "" : "s"} a encargadas`);
        }
        if (dispatch.encargadaNotifications) {
          parts.push(`${dispatch.encargadaNotifications} aviso${dispatch.encargadaNotifications === 1 ? "" : "s"} en plataforma`);
        }
        if (dispatch.qualityNotifications) {
          parts.push(`${dispatch.qualityNotifications} registro${dispatch.qualityNotifications === 1 ? "" : "s"} en tu bandeja`);
        }

        if (parts.length > 0) {
          push({
            title: "Informe validado",
            description: parts.join(" · "),
            tone: "success",
          });
        } else if (dispatch.errors?.length) {
          push({
            title: "Informe validado con advertencias",
            description: dispatch.errors.join(" "),
            tone: "warning",
          });
        } else {
          push({
            title: "Informe validado",
            description: "No hay encargadas con alcance asignado para esta jornada.",
            tone: "info",
          });
        }
      } else {
        push({
          title: "Informe validado",
          description: "El seguimiento de inasistencias quedó habilitado.",
          tone: "success",
        });
      }
    } catch {
      setError("Error de red al validar el informe.");
    } finally {
      setOperationsSaving(false);
    }
  };

  const publicFormHref = publicFormUrl(formId);

  const closureRecord = useMemo(() => {
    const report = operations?.handoffReport;
    return {
      closedByName: report?.closedByName ?? operations?.onSiteClosedByName,
      closedAt: report?.closedAt ?? operations?.onSiteClosedAt ?? report?.generatedAt,
      validatedByName: operations?.handoffValidatedByName,
      validatedAt: operations?.handoffValidatedAt,
      validationStatus: handoffValidationStatus,
    };
  }, [operations, handoffValidationStatus]);

  const copyFormLink = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicFormHref}`
        : publicFormHref;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("No se pudo copiar el enlace al portapapeles.");
    }
  };

  const arrivalPct =
    expectedAttendees > 0 ? Math.round((checkedInCount / expectedAttendees) * 100) : 0;
  const hasActiveFilters =
    filter !== "all" || generationFilter !== "all" || search.trim().length > 0;

  const showJustificationColumns = useMemo(() => {
    if (
      filter === "absence-pending-action" ||
      filter === "absence-pending-review" ||
      filter === "absence-pending-review-pre" ||
      filter === "absence-pending-review-post" ||
      filter === "absence-approved" ||
      filter === "absence-unjustified" ||
      filter === "unclosed"
    ) {
      return true;
    }
    return filtered.some(
      (submission) =>
        submission.data.attendance === "no" &&
        getParticipantJustificationSummary(submission).hasContent
    );
  }, [filter, filtered]);

  const compactCohortView = generationFilter !== "all";

  if (loading) {
    return <LoadingState variant="table" />;
  }

  if (submissions.length === 0 && rosterPending.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Sin respuestas en su alcance"
        description="Aún no hay participantes asignados a este formulario para su equipo."
      />
    );
  }

  const showingRosterPending = isRosterFilter && !isSearchMode;
  const unclosedHasResults = filtered.length > 0 || filteredPending.length > 0;
  const searchHasResults = filtered.length > 0 || filteredPending.length > 0;

  const includeRosterExport = isSearchMode || showingRosterPending || isUnclosedFilter;
  const includeSubmissionsExport = isSearchMode || isUnclosedFilter || !isRosterFilter;

  const exportCurrentView = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [];

    if (includeSubmissionsExport) {
      for (const submission of filtered) {
        const data = submission.data;
        const category = classifyAbsenceSubmission(submission);
        const reviewContext = classifyPendingReviewContext(submission);
        const row = [
          String(data.name ?? data.fullName ?? ""),
          String(data.rut ?? ""),
          getSubmissionGeneration(data),
          formatSubmissionPhone(data.phone),
          String(data.email ?? ""),
          data.attendance === "yes" ? "Confirmó" : data.attendance === "no" ? "Inasistencia" : "—",
          category ? absenceCategoryLabel(category) : submission.dayCheckIn?.present ? "Asistió" : CONFIRMED_NO_SHOW_ROW_LABEL,
          reviewContext ? pendingReviewContextLabel(reviewContext) : "",
        ];
        if (showJustificationColumns) {
          const excuse = getExcuseSubmissionDisplay(submission);
          row.push(excuse ? [excuse.label, excuse.contextLabel].filter(Boolean).join(" · ") : "");
        }
        row.push(
          submission.dayCheckIn?.present ? "Sí" : "No",
          String((submission.absenceContactLog ?? []).length),
          formatSubmissionDate(submission.createdAt)
        );
        rows.push(row);
      }
    }

    if (includeRosterExport) {
      for (const student of filteredPending) {
        const contacts = student.outreachLog ?? [];
        const lastContact = contacts[contacts.length - 1];
        rows.push([
          student.fullName,
          student.rut ?? "",
          formatGenerationDisplay(student.generation),
          formatSubmissionPhone(student.phone),
          student.email ?? "",
          "Sin registro",
          "",
          "",
          ...(showJustificationColumns ? [""] : []),
          String(contacts.length),
          lastContact ? formatAbsenceContactDate(lastContact.contactedAt) : "",
        ]);
      }
    }

    if (!rows.length) return;

    downloadOperationsCsv({
      filename: `${formId}-${filter}-${stamp}.csv`,
      headers: [
        "Nombre",
        "RUT",
        "Generación",
        "Teléfono",
        "Correo",
        "Asistencia / estado",
        "Detalle estado",
        "Contexto revisión",
        ...(showJustificationColumns ? ["Excusa"] : []),
        "Asistió / contactos",
        "Nº contactos",
        "Fecha",
      ],
      rows,
    });
  };

  const excuseColumns: AdminDataTableColumn<ExperienceFormSubmission>[] = [
    {
      id: "excuse",
      header: "Excusa",
      headerClassName: "w-44 text-center",
      cellClassName: "text-center align-middle",
      cell: (submission) => <ExcuseStatusCell submission={submission} />,
    },
  ];

  const columns: AdminDataTableColumn<ExperienceFormSubmission>[] = [
    {
      id: "checkin",
      header: "Asistió",
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
            disabled={isSaving || !rsvpYes || onSiteClosed}
            title={
              onSiteClosed ? "Jornada cerrada: la asistencia presencial ya no se puede registrar" : undefined
            }
            onChange={(event) => {
              void handleCheckIn(submissionId, event.target.checked);
            }}
            aria-label={`Marcar asistencia de ${participantName}`}
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
    ...(compactCohortView
      ? []
      : [
          {
            id: "generation",
            header: "Generación",
            cell: (submission: ExperienceFormSubmission) => {
              const fullLabel = getSubmissionGeneration(submission.data);
              const shortLabel = shortProgramLabel(fullLabel);
              return (
                <span
                  className="text-sm font-medium text-foreground"
                  title={fullLabel !== "—" ? fullLabel : undefined}
                >
                  {shortLabel}
                </span>
              );
            },
          } satisfies AdminDataTableColumn<ExperienceFormSubmission>,
        ]),
    ...(showJustificationColumns ? excuseColumns : []),
    {
      id: "status",
      header: "Estado",
      headerClassName: "w-36 text-center",
      cellClassName: "text-center align-middle",
      cell: (submission) => {
        const isSaving = checkInSavingId === (submission._id ?? "");
        const checkedIn = Boolean(submission.dayCheckIn?.present);
        const rsvpYes = submission.data.attendance === "yes";
        return (
          <AttendanceStatusBadge
            checkedIn={checkedIn}
            isSaving={isSaving}
            rsvpYes={rsvpYes}
            submission={submission}
          />
        );
      },
    },
  ];

  const submissionTableMinWidth = showJustificationColumns
    ? compactCohortView
      ? "min-w-[48rem]"
      : "min-w-[54rem]"
    : compactCohortView
      ? "min-w-[40rem]"
      : "min-w-[48rem]";
  const showingPendingActionFilter =
    filter === "absence-pending-action" ||
    filter === "absence-pending-review" ||
    filter === "absence-pending-review-pre" ||
    filter === "absence-pending-review-post";

  const rosterPendingColumns: AdminDataTableColumn<ConvocatoriaRosterStudent>[] = [
    {
      id: "participant",
      header: "Participante",
      cell: (student) => (
        <div className="flex items-center gap-3">
          <ParticipantAvatar name={student.fullName} />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{student.fullName}</p>
            {student.rut ? <p className="truncate text-xs text-muted">{student.rut}</p> : null}
          </div>
        </div>
      ),
    },
    ...(compactCohortView
      ? []
      : [
          {
            id: "generation",
            header: "Generación",
            cell: (student: ConvocatoriaRosterStudent) => {
              const fullLabel = formatGenerationDisplay(student.generation);
              const shortLabel = shortProgramLabel(fullLabel);
              return (
                <span
                  className="text-sm font-medium text-foreground"
                  title={fullLabel !== "—" ? fullLabel : undefined}
                >
                  {shortLabel}
                </span>
              );
            },
          } satisfies AdminDataTableColumn<ConvocatoriaRosterStudent>,
        ]),
    {
      id: "contacts",
      header: "Gestiones",
      cell: (student) => {
        const count = student.outreachLog?.length ?? 0;
        return (
          <span className="text-sm tabular-nums text-muted">{count > 0 ? count : "—"}</span>
        );
      },
    },
    {
      id: "status",
      header: "Estado",
      headerClassName: "w-36 text-center",
      cellClassName: "text-center align-middle",
      cell: () => <StatusBadge tone="neutral" label="Sin registro" />,
    },
  ];

  const renderRosterPendingRowActions = (student: ConvocatoriaRosterStudent) => {
    const isSaving = rosterSavingId === student.id;
    const action = getRosterRowAction(student.fullName);
    return (
      <RowActionButton
        actionLabel={action.label}
        ariaLabel={action.ariaLabel}
        priority={action.priority}
        disabled={isSaving}
        onClick={() => setManageTarget({ kind: "roster", student })}
      />
    );
  };

  const renderSubmissionRowActions = (submission: ExperienceFormSubmission) => {
    const submissionId = submission._id ?? "";
    const isSaving = checkInSavingId === submissionId;
    const isDeleting = deletingId === submissionId;
    const isReclassifying = generationSavingId === submissionId;
    const participantName = String(submission.data.name ?? submission.data.fullName ?? "—");
    const busy = isSaving || isDeleting || isReclassifying;
    const followUpLocked = isSubmissionFollowUpLocked(submission);
    const action = getSubmissionRowAction(
      submission,
      participantName,
      onSiteClosed,
      followUpLocked
    );

    return (
      <RowActionButton
        actionLabel={action.label}
        ariaLabel={action.ariaLabel}
        priority={action.priority}
        disabled={busy}
        onClick={() => setManageTarget({ kind: "submission", submission })}
      />
    );
  };

  return (
    <div className="student-affairs-jornada space-y-3">
      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}

      {!loading && onSiteClosed ? (
        <div className="space-y-3 rounded-xl border border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_5%,white)] p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {handoffValidated
                  ? "Informe validado — seguimiento Asuntos Estudiantiles"
                  : handoffPendingValidation
                    ? "Informe pendiente de validación"
                    : "Jornada presencial cerrada"}
              </p>
              <p className="text-sm text-muted">
                {handoffValidated
                  ? "El equipo de Asuntos Estudiantiles gestiona inasistencias, excusas y quienes no asistieron o no completaron el formulario. Los que asistieron quedaron bloqueados para ese perfil."
                  : handoffPendingValidation
                    ? "El encargado de gestión debe validar el informe en el sistema. Mientras tanto, Asuntos Estudiantiles puede preparar el seguimiento de quienes no asistieron."
                    : "Asuntos Estudiantiles continúa con revisión de excusas y seguimiento a quienes no asistieron ni completaron el formulario."}
              </p>
              {operations?.handoffReport ? (
                <p className="text-xs text-muted">
                  Traspaso: {operations.handoffReport.asistieron} asistieron ·{" "}
                  {operations.handoffReport.porRevisar} por revisar ·{" "}
                  {operations.handoffReport.sinRegistrarNiJustificar} sin registrar ni justificar
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {operations?.handoffReport ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-background"
                  onClick={() => void downloadClosurePdf()}
                >
                  Descargar PDF
                </Button>
              ) : null}
              {handoffPendingValidation && canValidateHandoff ? (
                <Button
                  type="button"
                  size="sm"
                  loading={operationsSaving}
                  disabled={operationsSaving}
                  onClick={() => setValidateHandoffOpen(true)}
                >
                  Validar informe
                </Button>
              ) : null}
              {canReopenOnSite ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-background"
                  loading={operationsSaving}
                  disabled={operationsSaving}
                  onClick={() => void handleReopenOnSitePhase()}
                >
                  Reabrir jornada
                </Button>
              ) : null}
            </div>
          </div>
          <OperationsClosureRecord
            closedByName={closureRecord.closedByName}
            closedAt={closureRecord.closedAt}
            validatedByName={closureRecord.validatedByName}
            validatedAt={closureRecord.validatedAt}
            validationStatus={closureRecord.validationStatus}
          />
        </div>
      ) : null}

      {!loading && !onSiteClosed && canCloseOnSite ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-sm text-muted">
            Fase presencial: registre asistencias e inasistencias. Al terminar, cierre y
            entregue el informe a Asuntos Estudiantiles.
          </p>
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            loading={operationsSaving}
            disabled={operationsSaving}
            onClick={() => void handleCloseOnSitePhase()}
          >
            Cerrar jornada y entregar informe
          </Button>
        </div>
      ) : null}

      <div className="student-affairs-jornada__layout">
        <div className="student-affairs-jornada__main">
          <div className="student-affairs-jornada__card">
            {stats ? (
              <>
                <div className="student-affairs-jornada__metrics">
                  <MetricCell label="Respondieron" value={stats.total} />
                  <MetricCell label="Confirmaron" value={stats.attending} tone="success" />
                  <MetricCell label="Inasistencias" value={stats.notAttending} tone="warning" />
                  <MetricCell label="Asistieron" value={checkedInCount} tone="info" />
                </div>
                {expectedAttendees > 0 ? (
                  <div className="student-affairs-jornada__progress-inline">
                    <span className="shrink-0 font-medium text-foreground">Avance</span>
                    <div className="student-affairs-jornada__progress-track">
                      <div
                        className={cn(
                          "student-affairs-jornada__progress-fill",
                          getArrivalProgressToneClass(arrivalPct, "progress-fill")
                        )}
                        style={{ width: `${arrivalPct}%` }}
                        role="progressbar"
                        aria-valuenow={checkedInCount}
                        aria-valuemin={0}
                        aria-valuemax={expectedAttendees}
                        aria-label={`Asistencia registrada: ${arrivalPct}%`}
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchBar
                  placeholder="Buscar participante (nombre, correo, teléfono, RUT)…"
                  value={search}
                  onChange={setSearch}
                  className="student-affairs-jornada__search max-w-none flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={
                    isSearchMode
                      ? !searchHasResults
                      : isUnclosedFilter
                        ? !unclosedHasResults
                        : showingRosterPending
                          ? filteredPending.length === 0
                          : filtered.length === 0
                  }
                  onClick={exportCurrentView}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
              {isSearchMode ? (
                <p className="text-xs text-muted">
                  Buscando en todos los participantes, sin importar confirmación ni estado.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <AttendanceFilterChip
                  active={filter === "all"}
                  label="Todos"
                  count={submissions.length}
                  onClick={() => setFilter("all")}
                />
                <AttendanceFilterChip
                  active={filter === "pending-checkin"}
                  label={CONFIRMED_NO_SHOW_LABEL_SHORT}
                  title={CONFIRMED_NO_SHOW_LABEL}
                  count={pendingArrival}
                  onClick={() => setFilter("pending-checkin")}
                />
                <AttendanceFilterChip
                  active={filter === "checked-in"}
                  label="Asistieron"
                  count={checkedInCount}
                  onClick={() => setFilter("checked-in")}
                />
                {pendingActionCount > 0 ? (
                  <AttendanceFilterChip
                    active={
                      filter === "absence-pending-action" ||
                      filter === "absence-pending-review" ||
                      filter === "absence-pending-review-pre" ||
                      filter === "absence-pending-review-post" ||
                      filter === "absence-pending-email"
                    }
                    label={PENDING_VALIDATION_CONTACT_LABEL}
                    title={PENDING_VALIDATION_CONTACT_LABEL_FULL}
                    count={pendingActionCount}
                    onClick={() => setFilter("absence-pending-action")}
                  />
                ) : null}
                {(absenceCounts.awaitingJustification ?? 0) > 0 ? (
                  <AttendanceFilterChip
                    active={filter === "absence-awaiting-justification"}
                    label="Plazo justificación"
                    count={absenceCounts.awaitingJustification}
                    onClick={() => setFilter("absence-awaiting-justification")}
                  />
                ) : null}
                {unclosedCount > 0 ? (
                  <AttendanceFilterChip
                    active={isUnclosedFilter}
                    label="Sin registrar ni justificar"
                    count={unclosedCount}
                    onClick={() => setFilter("unclosed")}
                  />
                ) : null}
                {dropoutCount > 0 ? (
                  <AttendanceFilterChip
                    active={filter === "absence-dropout"}
                    label="Desertores"
                    count={dropoutCount}
                    onClick={() => setFilter("absence-dropout")}
                  />
                ) : null}
                {(absenceCounts.approved ?? 0) > 0 ? (
                  <AttendanceFilterChip
                    active={filter === "absence-approved"}
                    label="Justificación aceptada"
                    count={absenceCounts.approved}
                    onClick={() => setFilter("absence-approved")}
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
              {isSearchMode ? (
                !searchHasResults ? (
                  <EmptyState
                    title="Sin coincidencias"
                    description="Prueba otro nombre, correo, teléfono o RUT."
                    className="border-0 bg-transparent shadow-none"
                  />
                ) : (
                  <div className="space-y-6">
                    {filtered.length > 0 ? (
                      <div>
                        {filteredPending.length > 0 ? (
                          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted sm:px-0">
                            Con respuesta en formulario ({filtered.length})
                          </p>
                        ) : null}
                        <div className="student-affairs-jornada__table-scroll">
                          <AdminDataTable
                            columns={columns}
                            data={filtered}
                            rowKey={(submission) => submission._id ?? submission.createdAt}
                            emptyTitle="Nadie en esta vista"
                            emptyDescription="Prueba otro filtro o actualiza la lista."
                            rowActions={renderSubmissionRowActions}
                            rowActionsLabel="Acción"
                            stickyEndColumn
                            tableMinWidth={submissionTableMinWidth}
                          />
                        </div>
                      </div>
                    ) : null}
                    {filteredPending.length > 0 ? (
                      <div>
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted sm:px-0">
                          En nómina sin registro ({filteredPending.length})
                        </p>
                        <div className="student-affairs-jornada__table-scroll">
                          <AdminDataTable
                            columns={rosterPendingColumns}
                            data={filteredPending}
                            rowKey={(student) => student.id}
                            emptyTitle="Nadie en esta vista"
                            emptyDescription="Prueba otro filtro o actualiza la lista."
                            rowActions={renderRosterPendingRowActions}
                            rowActionsLabel="Acción"
                            stickyEndColumn
                            tableMinWidth="min-w-[40rem]"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              ) : isUnclosedFilter ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 sm:px-0">
                    <p className="max-w-3xl text-sm text-muted">
                      Casos sin cerrar: en nómina sin completar el formulario, o con inasistencia
                      cerrada sin justificación válida. Registre asistencia, marque inasistencia o
                      dé seguimiento según corresponda.
                    </p>
                    {filteredPending.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => void copyFormLink()}>
                          Copiar enlace al formulario
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(publicFormHref, "_blank", "noopener,noreferrer")}
                        >
                          Abrir formulario
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {!unclosedHasResults ? (
                    <EmptyState
                      title="Nadie en esta vista"
                      description="Prueba otro filtro o actualiza la lista."
                      className="border-0 bg-transparent shadow-none"
                    />
                  ) : (
                    <div className="space-y-6">
                      {filteredPending.length > 0 ? (
                        <div>
                          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted sm:px-0">
                            Sin registro en formulario ({filteredPending.length})
                          </p>
                          <div className="student-affairs-jornada__table-scroll">
                            <AdminDataTable
                              columns={rosterPendingColumns}
                              data={filteredPending}
                              rowKey={(student) => student.id}
                              emptyTitle="Nadie en esta vista"
                              emptyDescription="Prueba otro filtro o actualiza la lista."
                              rowActions={renderRosterPendingRowActions}
                              rowActionsLabel="Acción"
                              stickyEndColumn
                              tableMinWidth="min-w-[40rem]"
                            />
                          </div>
                        </div>
                      ) : null}
                      {filtered.length > 0 ? (
                        <div>
                          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted sm:px-0">
                            Sin justificar ({filtered.length})
                          </p>
                          <div className="student-affairs-jornada__table-scroll">
                            <AdminDataTable
                              columns={columns}
                              data={filtered}
                              rowKey={(submission) => submission._id ?? submission.createdAt}
                              emptyTitle="Nadie en esta vista"
                              emptyDescription="Prueba otro filtro o actualiza la lista."
                              rowActions={renderSubmissionRowActions}
                              rowActionsLabel="Acción"
                              stickyEndColumn
                              tableMinWidth={submissionTableMinWidth}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : showingRosterPending ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 sm:px-0">
                    <p className="max-w-xl text-sm text-muted">
                      En nómina oficial sin confirmación ni justificación. Si asistió sin completar
                      el formulario, regístrelo aquí; si no asistió, marque inasistencia para
                      cerrar su caso.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => void copyFormLink()}>
                        Copiar enlace al formulario
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(publicFormHref, "_blank", "noopener,noreferrer")}
                      >
                        Abrir formulario
                      </Button>
                    </div>
                  </div>
                  {filteredPending.length === 0 ? (
                    <EmptyState
                      title="Nadie en esta vista"
                      description="Prueba otro filtro o actualiza la lista."
                      className="border-0 bg-transparent shadow-none"
                    />
                  ) : (
                    <div className="student-affairs-jornada__table-scroll">
                      <AdminDataTable
                        columns={rosterPendingColumns}
                        data={filteredPending}
                        rowKey={(student) => student.id}
                        emptyTitle="Nadie en esta vista"
                        emptyDescription="Prueba otro filtro o actualiza la lista."
                        rowActions={renderRosterPendingRowActions}
                        rowActionsLabel="Acción"
                        stickyEndColumn
                        tableMinWidth="min-w-[40rem]"
                      />
                    </div>
                  )}
                </>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="Nadie en esta vista"
                  description="Prueba otro filtro o actualiza la lista."
                  className="border-0 bg-transparent shadow-none"
                />
              ) : (
                <>
                  {showingPendingActionFilter ? (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 sm:px-0">
                      <p className="max-w-3xl text-sm text-muted">
                        Participantes con inasistencia pendientes de contacto o con excusa por
                        revisar. Envíe correo o registre llamada; el plazo de 3 días inicia al
                        notificar a cada uno.{" "}
                        <strong className="font-semibold text-foreground">Excusa</strong> indica si
                        enviaron respaldo;{" "}
                        <strong className="font-semibold text-foreground">Estado</strong> y el botón
                        de acción indican qué falta hacer.
                      </p>
                      {(absenceCounts.pendingEmail ?? 0) > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={bulkJustificationSaving}
                          disabled={bulkJustificationSaving}
                          onClick={() => void handleBulkSendJustificationRequests()}
                        >
                          Enviar correos listos
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {filter === "absence-approved" ? (
                    <p className="mb-3 max-w-3xl px-2 text-sm text-muted sm:px-0">
                      Justificaciones ya validadas y aceptadas por el equipo.
                    </p>
                  ) : null}
                  <div className="student-affairs-jornada__table-scroll">
                    <AdminDataTable
                      columns={columns}
                      data={filtered}
                      rowKey={(submission) => submission._id ?? submission.createdAt}
                      emptyTitle="Nadie en esta vista"
                      emptyDescription="Prueba otro filtro o actualiza la lista."
                      rowActions={renderSubmissionRowActions}
                      rowActionsLabel="Acción"
                      stickyEndColumn
                      tableMinWidth={submissionTableMinWidth}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="student-affairs-jornada__aside space-y-3">
          {onSiteClosed ? (
            <OperationsClosureRecord
              compact
              closedByName={closureRecord.closedByName}
              closedAt={closureRecord.closedAt}
            />
          ) : null}
          {stats ? (
            <div className="student-affairs-jornada__aside-card space-y-3">
              <h3 className="student-affairs-jornada__aside-title">Resumen jornada</h3>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {checkedInCount}
                  {expectedAttendees > 0 ? (
                    <span className="text-base font-semibold text-muted">
                      {" "}
                      / {expectedAttendees}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  Asistieron
                  {expectedAttendees > 0 ? ` (${arrivalPct}% de confirmados)` : ""}
                </p>
              </div>
              {expectedAttendees > 0 ? (
                <div className="student-affairs-jornada__cohort-bar">
                  <div
                    className={cn(
                      "student-affairs-jornada__cohort-bar-fill",
                      getArrivalProgressToneClass(arrivalPct, "cohort-bar-fill")
                    )}
                    style={{ width: `${arrivalPct}%` }}
                  />
                </div>
              ) : null}
              {asidePendingItems.length > 0 ? (
                <div className="space-y-1 border-t border-border pt-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                    Requieren gestión
                  </p>
                  {asidePendingItems.map((item) => (
                    <SummaryRow
                      key={item.filter}
                      dotClass={item.dotClass}
                      label={item.label}
                      value={item.value}
                      active={
                        filter === item.filter ||
                        (item.filter === "absence-pending-action" &&
                          (filter === "absence-pending-review" ||
                            filter === "absence-pending-review-pre" ||
                            filter === "absence-pending-review-post" ||
                            filter === "absence-pending-email"))
                      }
                      onClick={() => setFilter(item.filter)}
                    />
                  ))}
                </div>
              ) : (
                <p className="border-t border-border pt-3 text-xs text-muted">
                  Sin pendientes operativos.
                </p>
              )}
            </div>
          ) : null}

          {hasRoster && cohortCards.length > 0 ? (
            <div className="student-affairs-jornada__aside-card space-y-2">
              <h3 className="student-affairs-jornada__aside-title">Confirmación por programa</h3>
              <div className="space-y-2">
                {cohortCards.map((cohort) => (
                  <div key={cohort.generation}>
                    <div className="student-affairs-jornada__stat-row">
                      <span className="truncate text-xs font-medium text-foreground">
                        {cohort.shortLabel}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted">
                        {cohort.confirmed}/{cohort.nominated} · {cohort.pct}%
                      </span>
                    </div>
                    <div className="student-affairs-jornada__cohort-bar mt-1">
                      <div
                        className="student-affairs-jornada__cohort-bar-fill"
                        style={{ width: `${cohort.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(absenceCounts.pendingReview ?? 0) > 0 ? (
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

      <Drawer
        open={Boolean(manageTarget)}
        onClose={() => setManageTarget(null)}
        title="Expediente del participante"
      >
        {manageTarget ? (
          <ParticipantManageDrawer
            formId={formId}
            target={manageTarget}
            canDeleteSubmissions={canDeleteSubmissions}
            canReclassifyGeneration={canReclassifyGeneration}
            isSaving={
              manageTarget.kind === "roster"
                ? rosterSavingId === manageTarget.student.id
                : checkInSavingId === manageTarget.submission._id ||
                  deletingId === manageTarget.submission._id ||
                  generationSavingId === manageTarget.submission._id
            }
            onClose={() => setManageTarget(null)}
            onSiteClosed={onSiteClosed}
            followUpLocked={
              manageTarget.kind === "submission"
                ? isSubmissionFollowUpLocked(manageTarget.submission)
                : false
            }
            onCheckIn={(present) => {
              if (manageTarget.kind !== "submission" || !manageTarget.submission._id) return;
              void handleCheckIn(manageTarget.submission._id, present);
            }}
            onMarkAbsent={() => {
              if (manageTarget.kind !== "submission" || !manageTarget.submission._id) return;
              const name = String(
                manageTarget.submission.data.name ??
                  manageTarget.submission.data.fullName ??
                  "Participante"
              );
              setManageTarget(null);
              void handleMarkAbsent(manageTarget.submission._id, name);
            }}
            onMarkArrivedFromAbsence={() => {
              if (manageTarget.kind !== "submission" || !manageTarget.submission._id) return;
              const name = String(
                manageTarget.submission.data.name ??
                  manageTarget.submission.data.fullName ??
                  "Participante"
              );
              setManageTarget(null);
              void handleMarkArrivedFromAbsence(manageTarget.submission._id, name);
            }}
            onSendJustificationEmail={() => {
              if (manageTarget.kind !== "submission") return;
              const name = String(
                manageTarget.submission.data.name ??
                  manageTarget.submission.data.fullName ??
                  "Participante"
              );
              setManageTarget(null);
              openJustificationEmailDialog(manageTarget.submission, name);
            }}
            onPhoneContact={() => {
              if (manageTarget.kind !== "submission") return;
              setManageTarget(null);
              openPhoneContact(manageTarget.submission);
            }}
            onReviewAbsence={() => {
              if (manageTarget.kind !== "submission") return;
              setManageTarget(null);
              setReviewSubmission(manageTarget.submission);
            }}
            onReclassifyGeneration={() => {
              if (manageTarget.kind !== "submission") return;
              setManageTarget(null);
              setReclassifySubmission(manageTarget.submission);
            }}
            onDelete={() => {
              if (manageTarget.kind !== "submission" || !manageTarget.submission._id) return;
              const name = String(
                manageTarget.submission.data.name ??
                  manageTarget.submission.data.fullName ??
                  "Participante"
              );
              setManageTarget(null);
              void handleDelete(manageTarget.submission._id, name);
            }}
            onRosterCheckIn={() => {
              if (manageTarget.kind !== "roster") return;
              setManageTarget(null);
              void handleRosterOnSite(manageTarget.student, "check-in");
            }}
            onRosterMarkAbsent={() => {
              if (manageTarget.kind !== "roster") return;
              setManageTarget(null);
              void handleRosterOnSite(manageTarget.student, "mark-absent");
            }}
            onRosterUpdated={handleRosterUpdated}
            onSubmissionUpdated={handleSubmissionUpdated}
            onRosterJustificationSent={handleRosterJustificationSent}
            confirmAction={confirm}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(contactSubmission)}
        onClose={() => setContactSubmission(null)}
        title="Gestiones del expediente"
      >
        {contactSubmission?._id ? (
          <AbsenceContactDrawer
            submission={contactSubmission}
            onSaved={handleContactSaved}
            onCancel={() => setContactSubmission(null)}
          />
        ) : null}
      </Drawer>

      <InputDialog
        open={Boolean(justificationEmailTarget)}
        onClose={() => setJustificationEmailTarget(null)}
        title="Enviar solicitud de justificación"
        description={
          justificationEmailTarget
            ? `Indique el correo de ${justificationEmailTarget.participantName}. Al enviar, comenzará un plazo de 3 días para que complete su justificación.`
            : undefined
        }
        fields={[
          {
            id: "email",
            label: "Correo del participante",
            placeholder: "nombre@ejemplo.com",
            defaultValue: justificationEmailTarget?.email ?? "",
            required: true,
          },
        ]}
        submitLabel="Enviar correo"
        loading={justificationEmailSaving}
        onSubmit={(values) => void handleSendJustificationRequest(values.email ?? "")}
      />

      <CloseJornadaHandoffDialog
        open={closeJornadaOpen}
        loading={operationsSaving}
        checkedInCount={checkedInCount}
        expectedAttendees={expectedAttendees}
        arrivalPct={arrivalPct}
        pendingArrival={pendingArrival}
        pendingReview={absenceCounts.pendingReview}
        unclosedCount={unclosedCount}
        pendingEmail={absenceCounts.pendingEmail}
        awaitingJustification={absenceCounts.awaitingJustification}
        onClose={() => setCloseJornadaOpen(false)}
        onConfirm={() => void submitCloseOnSitePhase()}
      />

      <ValidateHandoffDialog
        open={validateHandoffOpen}
        loading={operationsSaving}
        report={operations?.handoffReport ?? null}
        closedByName={closureRecord.closedByName}
        onClose={() => setValidateHandoffOpen(false)}
        onConfirm={() => void submitValidateHandoff()}
      />

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
  onClick,
  active,
}: {
  dotClass: string;
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = cn(
    "student-affairs-jornada__stat-row",
    onClick &&
      "w-full cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 text-left transition hover:bg-background-muted/60",
    active && "bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
  );

  const content = (
    <>
      <span className="flex min-w-0 items-center gap-2 text-muted">
        <span className={cn("student-affairs-jornada__stat-dot shrink-0", dotClass)} aria-hidden />
        <span className="truncate text-xs">{label}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{value}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function AttendanceFilterChip({
  active,
  label,
  count,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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

function ExcuseStatusCell({
  submission,
}: {
  submission: ExperienceFormSubmission;
}) {
  const display = getExcuseSubmissionDisplay(submission);
  if (!display) {
    return <span className="text-sm text-muted">—</span>;
  }

  return (
    <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-0.5 text-center">
      <StatusBadge tone={display.tone} label={display.label} title={display.title} />
      {display.contextLabel ? (
        <p className="text-[10px] text-muted">{display.contextLabel}</p>
      ) : null}
    </div>
  );
}

type RowActionPriority = "high" | "normal" | "low";

function getSubmissionRowAction(
  submission: ExperienceFormSubmission,
  participantName: string,
  onSiteClosed = false,
  followUpLocked = false
): { label: string; ariaLabel: string; priority: RowActionPriority } {
  if (followUpLocked) {
    return {
      label: "Ver detalle",
      ariaLabel: `Ver detalle de ${participantName} (bloqueado)`,
      priority: "low",
    };
  }

  const rsvpYes = submission.data.attendance === "yes";
  const checkedIn = Boolean(submission.dayCheckIn?.present);

  if (rsvpYes) {
    if (!checkedIn) {
      if (onSiteClosed) {
        return {
          label: "Dar seguimiento",
          ariaLabel: `Dar seguimiento a ${participantName}`,
          priority: "normal",
        };
      }
      return {
        label: "Registrar asistencia",
        ariaLabel: `Registrar asistencia de ${participantName}`,
        priority: "high",
      };
    }
    return {
      label: "Ver detalle",
      ariaLabel: `Ver detalle de ${participantName}`,
      priority: "low",
    };
  }

  const category = classifyAbsenceSubmission(submission);
  switch (category) {
    case "pending-email":
      return {
        label: "Contactar",
        ariaLabel: `Contactar a ${participantName}`,
        priority: "high",
      };
    case "awaiting-justification":
      return {
        label: "Dar seguimiento",
        ariaLabel: `Dar seguimiento a ${participantName}`,
        priority: "normal",
      };
    case "pending-review":
      return {
        label: "Revisar",
        ariaLabel: `Revisar justificación de ${participantName}`,
        priority: "high",
      };
    case "unjustified":
      return {
        label: "Dar seguimiento",
        ariaLabel: `Dar seguimiento a ${participantName}`,
        priority: "normal",
      };
    case "approved":
      return {
        label: "Ver detalle",
        ariaLabel: `Ver detalle de ${participantName}`,
        priority: "low",
      };
    case "dropout":
      return {
        label: "Ver expediente",
        ariaLabel: `Ver expediente de ${participantName}`,
        priority: "low",
      };
    default:
      return {
        label: "Atender",
        ariaLabel: `Atender a ${participantName}`,
        priority: "normal",
      };
  }
}

function getRosterRowAction(participantName: string): {
  label: string;
  ariaLabel: string;
  priority: RowActionPriority;
} {
  return {
    label: "Atender",
    ariaLabel: `Atender a ${participantName}`,
    priority: "high",
  };
}

function RowActionButton({
  actionLabel,
  ariaLabel,
  priority = "normal",
  disabled,
  onClick,
}: {
  actionLabel: string;
  ariaLabel: string;
  priority?: RowActionPriority;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={priority === "low" ? "ghost" : "outline"}
      size="sm"
      disabled={disabled}
      className={cn(
        "student-affairs-jornada__action-btn shrink-0 whitespace-nowrap px-2.5 font-semibold",
        priority === "high" && "student-affairs-jornada__action-btn--high",
        priority === "normal" && "student-affairs-jornada__action-btn--normal",
        priority === "low" && "student-affairs-jornada__action-btn--low"
      )}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      {actionLabel}
    </Button>
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
  const avatarBackgrounds = [
    "var(--sem-primary)",
    "var(--sem-secondary)",
    "color-mix(in srgb, var(--sem-primary) 72%, var(--sem-accent))",
    "color-mix(in srgb, var(--sem-secondary) 78%, var(--sem-primary))",
    "color-mix(in srgb, var(--sem-accent) 55%, var(--sem-primary))",
  ] as const;
  const backgroundIndex =
    [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarBackgrounds.length;

  return (
    <span
      className="student-affairs-jornada__participant-avatar"
      style={{ background: avatarBackgrounds[backgroundIndex] }}
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
  submission,
}: {
  checkedIn: boolean;
  isSaving: boolean;
  rsvpYes: boolean;
  submission: ExperienceFormSubmission;
}) {
  if (rsvpYes) {
    if (checkedIn) return <StatusBadge tone="active" label="Asistió" />;
    return (
      <StatusBadge
        tone="pending"
        label={isSaving ? "Guardando…" : "Sin asistir"}
        className="student-affairs-jornada__status-pending"
      />
    );
  }

  const category = classifyAbsenceSubmission(submission);
  if (category === "pending-email") {
    return (
      <StatusBadge
        tone="neutral"
        label="Pendiente contacto"
        className="student-affairs-jornada__status-pending-email"
      />
    );
  }
  if (category === "awaiting-justification") {
    const deadline = submission.absenceReview?.justificationDeadlineAt;
    const deadlineLabel = deadline ? formatJustificationDeadline(deadline) : null;
    return (
      <StatusBadge
        tone="pending"
        label="Plazo para justificar"
        className="student-affairs-jornada__status-awaiting"
        title={deadlineLabel ? `Plazo hasta ${deadlineLabel}` : undefined}
      />
    );
  }
  if (category === "unjustified") {
    return (
      <StatusBadge
        tone="pending"
        label="Sin justificar"
        className="student-affairs-jornada__status-unjustified"
      />
    );
  }
  if (category === "pending-review") {
    return (
      <StatusBadge
        tone="info"
        label="Por revisar"
        className="student-affairs-jornada__status-justified"
      />
    );
  }
  if (category === "approved") {
    return (
      <StatusBadge
        tone="active"
        label={absenceCategoryLabel("approved")}
        className="student-affairs-jornada__status-approved"
      />
    );
  }
  if (category === "dropout") {
    return (
      <StatusBadge
        tone="neutral"
        label="Desertor"
        className="student-affairs-jornada__status-dropout"
        title={submission.absenceReview?.closureNotes?.trim() || undefined}
      />
    );
  }

  return <StatusBadge tone="neutral" label="Inasistencia" />;
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

function getArrivalProgressToneClass(
  pct: number,
  variant: "progress-fill" | "cohort-bar-fill"
): string {
  const prefix =
    variant === "progress-fill"
      ? "student-affairs-jornada__progress-fill"
      : "student-affairs-jornada__cohort-bar-fill";
  if (pct >= 90) return `${prefix}--complete`;
  if (pct >= 70) return `${prefix}--good`;
  if (pct >= 40) return `${prefix}--warning`;
  return `${prefix}--low`;
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
