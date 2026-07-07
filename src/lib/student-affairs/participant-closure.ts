import type { AbsenceListCategory } from "@/lib/student-affairs/absence-categories";
import { absenceCategoryLabel } from "@/lib/student-affairs/absence-categories";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

export const DROPOUT_NOTES_MIN_LENGTH = 20;

export function buildParticipantDropoutFields(input: {
  operatorName?: string;
  notes?: string;
  now?: string;
}): Record<string, string> {
  const now = input.now ?? new Date().toISOString();
  return {
    "absenceReview.closureReason": "dropout",
    "absenceReview.closureNotes": input.notes?.trim() || "",
    "absenceReview.closedAt": now,
    "absenceReview.closedByName": input.operatorName?.trim() || "",
  };
}

export function isDropoutContactOutcome(outcome?: string): boolean {
  return outcome === "dropout";
}

export function submissionShowsDropoutStatus(submission: ExperienceFormSubmission): boolean {
  return submission.absenceReview?.closureReason === "dropout";
}

export function validateDropoutNotes(
  notes: string
): { ok: true; normalized: string } | { ok: false; error: string } {
  const normalized = notes.trim();
  if (!normalized) {
    return { ok: false, error: "Indique el antecedente de la deserción." };
  }
  if (normalized.length < DROPOUT_NOTES_MIN_LENGTH) {
    return {
      ok: false,
      error: `El antecedente debe tener al menos ${DROPOUT_NOTES_MIN_LENGTH} caracteres (año, contexto o fuente).`,
    };
  }
  if (/^\d+$/.test(normalized)) {
    return {
      ok: false,
      error: "Describa la deserción con contexto (año, pastor, acuerdo), no solo números.",
    };
  }
  return { ok: true, normalized };
}

const PENDING_OVERRIDE_CATEGORIES = new Set<AbsenceListCategory>([
  "pending-review",
  "awaiting-justification",
  "pending-email",
  "unjustified",
]);

export function willDropoutOverridePendingCase(
  category: AbsenceListCategory | null
): boolean {
  return category !== null && PENDING_OVERRIDE_CATEGORIES.has(category);
}

export function buildDropoutConfirmDescription(input: {
  participantName: string;
  currentStatusLabel: string;
  overridesPending: boolean;
}): string {
  const lines = [
    `Se cerrará el expediente de ${input.participantName} como baja institucional (Desertor).`,
    `Estado actual: ${input.currentStatusLabel}.`,
    "No podrá revertirse desde el panel y dejará de contarse en gestiones pendientes.",
  ];
  if (input.overridesPending) {
    lines.push(
      "Atención: esto reemplazará la revisión o justificación pendiente en curso."
    );
  }
  return lines.join(" ");
}

export function formatDropoutClosedAt(iso?: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(iso));
}

export function getDropoutStatusLabel(category: AbsenceListCategory | null): string {
  if (category === "dropout") return absenceCategoryLabel("dropout");
  if (category) return absenceCategoryLabel(category);
  return "Participante";
}
