import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import type { FormSubmissionAttachment } from "@/lib/experience/forms/attachments";
import {
  classifyAbsenceSubmission,
  classifyPendingReviewContext,
  pendingReviewContextLabel,
  type PendingReviewContext,
} from "@/lib/student-affairs/absence-categories";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

export type AbsenceValidationTone = "active" | "error" | "info" | "neutral" | "pending";

export interface ParticipantJustificationSummary {
  text: string | null;
  attachment: FormSubmissionAttachment | null;
  context: PendingReviewContext | null;
  contextLabel: string | null;
  hasContent: boolean;
}

export interface AbsenceValidationDisplay {
  label: string;
  tone: AbsenceValidationTone;
  title?: string;
}

export function getParticipantJustificationText(
  submission: ExperienceFormSubmission
): string | null {
  const text = String(
    submission.data.justification ?? submission.data.reason ?? ""
  ).trim();
  return text.length > 0 ? text : null;
}

export function getParticipantJustificationSummary(
  submission: ExperienceFormSubmission
): ParticipantJustificationSummary {
  const text = getParticipantJustificationText(submission);
  const attachment = getSubmissionAttachment(submission.data);
  const context = classifyPendingReviewContext(submission);

  return {
    text,
    attachment,
    context,
    contextLabel: context ? pendingReviewContextLabel(context) : null,
    hasContent: Boolean(text || attachment),
  };
}

export interface ExcuseSubmissionDisplay {
  label: string;
  tone: AbsenceValidationTone;
  contextLabel?: string;
  title?: string;
}

export function getExcuseSubmissionDisplay(
  submission: ExperienceFormSubmission
): ExcuseSubmissionDisplay | null {
  if (submission.data.attendance !== "no") {
    return null;
  }

  const category = classifyAbsenceSubmission(submission);
  const summary = getParticipantJustificationSummary(submission);
  const contextLabel = summary.contextLabel ?? undefined;

  if (category === "pending-review") {
    return {
      label: "Justificó",
      tone: "info",
      contextLabel,
      title: "Presentó excusa (texto o adjunto). Revise el expediente para ver el detalle.",
    };
  }

  if (category === "approved") {
    return {
      label: "Justificó",
      tone: "active",
      contextLabel,
      title: "Presentó excusa validada por el equipo.",
    };
  }

  if (submission.absenceReview?.status === "rejected") {
    return {
      label: "Justificó",
      tone: "neutral",
      contextLabel,
      title: "Presentó excusa; el equipo la rechazó.",
    };
  }

  if (category === "awaiting-justification") {
    return {
      label: "Sin justificación",
      tone: "pending",
      title: "Declaró inasistencia; plazo activo para enviar excusa.",
    };
  }

  if (category === "pending-email") {
    return {
      label: "Sin contacto",
      tone: "neutral",
      title: "Inasistencia operada; falta contactar para abrir plazo de excusa.",
    };
  }

  return {
    label: "Sin justificar",
    tone: "error",
    title: "No presentó excusa válida dentro del plazo.",
  };
}

/** Estado institucional de la justificación enviada por el participante. */
export function getAbsenceValidationDisplay(
  submission: ExperienceFormSubmission
): AbsenceValidationDisplay | null {
  if (submission.data.attendance !== "no") return null;

  const reviewStatus = submission.absenceReview?.status;
  const category = classifyAbsenceSubmission(submission);
  const reviewedAt = submission.absenceReview?.reviewedAt;
  const reviewedBy = submission.absenceReview?.reviewedByName;

  if (reviewStatus === "approved" || category === "approved") {
    const detail = [reviewedBy, reviewedAt].filter(Boolean).join(" · ");
    return {
      label: "Aceptada",
      tone: "active",
      title: detail ? `Validada — ${detail}` : "Excusa aceptada por el equipo",
    };
  }

  if (reviewStatus === "rejected") {
    return {
      label: "Rechazada",
      tone: "error",
      title: reviewedBy ? `Revisada por ${reviewedBy}` : "Excusa no procede",
    };
  }

  if (category === "pending-review") {
    return {
      label: "Pendiente",
      tone: "info",
      title: "Falta revisión del equipo (aprobar o rechazar)",
    };
  }

  if (category === "awaiting-justification") {
    return {
      label: "En plazo",
      tone: "pending",
      title: "Aún puede enviar excusa dentro del plazo",
    };
  }

  return null;
}

export function truncateJustificationText(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
