import type { ExperienceFormSubmission } from "@/types/experience-forms";
import type {
  HandoffValidationStatus,
  StudentAffairsFormOperations,
} from "@/types/student-affairs-operations";

export function getHandoffValidationStatus(
  operations: StudentAffairsFormOperations | null | undefined
): HandoffValidationStatus | null {
  if (!operations || operations.phase !== "follow-up") return null;
  return operations.handoffValidationStatus ?? "pending";
}

export function isHandoffValidated(
  operations: StudentAffairsFormOperations | null | undefined
): boolean {
  return getHandoffValidationStatus(operations) === "validated";
}

/** Registró asistencia presencial en la jornada. */
export function submissionAttendedOnSite(submission: ExperienceFormSubmission): boolean {
  return Boolean(submission.dayCheckIn?.present);
}

/** Requiere seguimiento de Asuntos Estudiantiles tras el cierre (no asistió a la jornada). */
export function submissionRequiresFollowUpManagement(
  submission: ExperienceFormSubmission
): boolean {
  if (submission.data.attendance === "no") return true;
  if (submission.data.attendance === "yes" && !submission.dayCheckIn?.present) return true;
  return false;
}

/**
 * Operador de asuntos estudiantiles con informe validado: solo puede gestionar
 * quienes no asistieron a la jornada presencial.
 */
export function isSubmissionLockedForStudentAffairsOperator(
  submission: ExperienceFormSubmission,
  operations: StudentAffairsFormOperations | null | undefined
): boolean {
  if (!isHandoffValidated(operations)) return false;
  return submissionAttendedOnSite(submission);
}
