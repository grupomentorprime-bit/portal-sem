import type { ExperienceFormSubmission } from "@/types/experience-forms";

export function submissionHasCompleteContactInfo(
  data: Record<string, unknown>
): boolean {
  const email = String(data.email ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  return Boolean(email && phone);
}

export function rosterStudentHasCompleteContactInfo(input: {
  email?: string | null;
  phone?: string | null;
}): boolean {
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  return Boolean(email && phone);
}

export function submissionNeedsContactInfoUpdate(
  submission: ExperienceFormSubmission
): boolean {
  return !submissionHasCompleteContactInfo(submission.data);
}

export const CONTACT_INFO_REQUIRED_MESSAGE =
  "Debe registrar correo y teléfono del participante antes de gestionar su expediente.";
