import type { ExperienceFormAbsenceReview } from "@/types/experience-forms";

/** Plazo para que el participante envíe justificación tras recibir el correo de solicitud. */
export const JUSTIFICATION_RESPONSE_DAYS = 3;

export function buildJustificationDeadline(from: Date = new Date()): string {
  const deadline = new Date(from);
  deadline.setUTCDate(deadline.getUTCDate() + JUSTIFICATION_RESPONSE_DAYS);
  return deadline.toISOString();
}

export function isJustificationDeadlineExpired(deadlineAt?: string): boolean {
  if (!deadlineAt) return false;
  return new Date(deadlineAt).getTime() < Date.now();
}

export function formatJustificationDeadline(deadlineAt: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(deadlineAt));
}

/** Registro inicial al marcar inasistencia en jornada (sin plazo hasta enviar correo). */
export function buildOperatorAbsenceMarked(input?: {
  operatorName?: string;
  operatorNotes?: string;
}): ExperienceFormAbsenceReview {
  return {
    status: "pending",
    managementNotes: input?.operatorNotes?.trim() || undefined,
    reviewedAt: new Date().toISOString(),
    reviewedByName: input?.operatorName?.trim() || undefined,
  };
}

/** Plazo que inicia al enviar el correo de solicitud de justificación. */
export function buildJustificationRequestSent(input?: {
  operatorName?: string;
  from?: Date;
}): Pick<
  ExperienceFormAbsenceReview,
  "justificationRequestedAt" | "justificationDeadlineAt" | "reviewedAt" | "reviewedByName"
> {
  const from = input?.from ?? new Date();
  const now = from.toISOString();
  return {
    justificationRequestedAt: now,
    justificationDeadlineAt: buildJustificationDeadline(from),
    reviewedAt: now,
    reviewedByName: input?.operatorName?.trim() || undefined,
  };
}

export function hasOpenJustificationDeadline(submission: {
  absenceReview?: ExperienceFormAbsenceReview;
}): boolean {
  const deadlineAt = submission.absenceReview?.justificationDeadlineAt;
  if (!deadlineAt) return false;
  return !isJustificationDeadlineExpired(deadlineAt);
}

/** @deprecated Usar buildOperatorAbsenceMarked + buildJustificationRequestSent al enviar correo. */
export function buildOperatorJustificationRequest(input?: {
  operatorName?: string;
  operatorNotes?: string;
  from?: Date;
}): ExperienceFormAbsenceReview {
  const marked = buildOperatorAbsenceMarked(input);
  const sent = buildJustificationRequestSent({
    operatorName: input?.operatorName,
    from: input?.from,
  });
  return { ...marked, ...sent };
}
