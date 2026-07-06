import { getSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { isJustificationDeadlineExpired } from "@/lib/experience/forms/absence-justification-deadline";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

export type AbsenceListCategory =
  | "pending-email"
  | "unjustified"
  | "awaiting-justification"
  | "pending-review"
  | "approved";

export function hasParticipantJustification(submission: ExperienceFormSubmission): boolean {
  const text = String(
    submission.data.justification ?? submission.data.reason ?? ""
  ).trim();
  if (text.length >= 10) return true;
  return Boolean(getSubmissionAttachment(submission.data));
}

export function isOperatorMarkedNoShow(submission: ExperienceFormSubmission): boolean {
  return Boolean(submission.data.operatorNoShow);
}

/** Clasifica inasistencias para listas de operación en jornada. */
export function classifyAbsenceSubmission(
  submission: ExperienceFormSubmission
): AbsenceListCategory | null {
  if (submission.data.attendance !== "no") return null;

  const reviewStatus = submission.absenceReview?.status;
  if (reviewStatus === "approved") return "approved";
  if (reviewStatus === "rejected") return "unjustified";

  if (hasParticipantJustification(submission)) return "pending-review";

  if (isOperatorMarkedNoShow(submission)) {
    const requestedAt = submission.absenceReview?.justificationRequestedAt;
    if (!requestedAt) return "pending-email";

    const deadlineAt = submission.absenceReview?.justificationDeadlineAt;
    if (deadlineAt) {
      if (isJustificationDeadlineExpired(deadlineAt)) return "unjustified";
      return "awaiting-justification";
    }
  }

  const deadlineAt = submission.absenceReview?.justificationDeadlineAt;
  if (deadlineAt) {
    if (isJustificationDeadlineExpired(deadlineAt)) return "unjustified";
    return "awaiting-justification";
  }

  return "unjustified";
}

export function countAbsenceCategories(submissions: ExperienceFormSubmission[]) {
  let pendingEmail = 0;
  let unjustified = 0;
  let awaitingJustification = 0;
  let pendingReview = 0;
  let approved = 0;

  for (const submission of submissions) {
    const category = classifyAbsenceSubmission(submission);
    if (category === "pending-email") pendingEmail++;
    else if (category === "unjustified") unjustified++;
    else if (category === "awaiting-justification") awaitingJustification++;
    else if (category === "pending-review") pendingReview++;
    else if (category === "approved") approved++;
  }

  return {
    pendingEmail,
    unjustified,
    awaitingJustification,
    pendingReview,
    approved,
    total: pendingEmail + unjustified + awaitingJustification + pendingReview + approved,
  };
}

export function absenceCategoryLabel(category: AbsenceListCategory): string {
  switch (category) {
    case "pending-email":
      return "Pendiente contacto";
    case "unjustified":
      return "Sin justificar";
    case "awaiting-justification":
      return "Plazo para justificar";
    case "pending-review":
      return "Por revisar";
    case "approved":
      return "Justificación aceptada";
  }
}

export function canSendJustificationRequest(submission: ExperienceFormSubmission): boolean {
  return classifyAbsenceSubmission(submission) === "pending-email";
}

export type PendingReviewContext = "pre-event" | "post-absence";

/** Distingue justificaciones enviadas antes de la jornada vs. tras inasistencia operada. */
export function classifyPendingReviewContext(
  submission: ExperienceFormSubmission
): PendingReviewContext | null {
  if (classifyAbsenceSubmission(submission) !== "pending-review") return null;
  return isOperatorMarkedNoShow(submission) ? "post-absence" : "pre-event";
}

export function countPendingReviewByContext(submissions: ExperienceFormSubmission[]) {
  let preEvent = 0;
  let postAbsence = 0;

  for (const submission of submissions) {
    const context = classifyPendingReviewContext(submission);
    if (context === "pre-event") preEvent++;
    else if (context === "post-absence") postAbsence++;
  }

  return { preEvent, postAbsence };
}

export function pendingReviewContextLabel(context: PendingReviewContext): string {
  return context === "pre-event" ? "Pre-jornada" : "Post-inasistencia";
}
