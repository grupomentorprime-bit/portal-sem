import type {
  ExperienceFormDefinition,
  ExperienceFormDestination,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import { EXPERIENCE_FORM_ID_ALIASES } from "@/types/experience-forms";
import { validateFormSubmission } from "./validation";

export interface FormSubmitResult {
  ok: boolean;
  submissionId?: string;
  errors?: Record<string, string>;
  message?: string;
}

export interface FormSubmissionStore {
  save(submission: ExperienceFormSubmission): Promise<{ id: string }>;
}

/** Enruta el envío según destino — extensible hacia CRM / Admisiones */
export async function processFormDestination(
  destination: ExperienceFormDestination,
  submission: ExperienceFormSubmission
): Promise<void> {
  switch (destination) {
    case "contact":
    case "information_request":
    case "attendance_confirmation":
    case "absence_justification":
    case "event_registration":
    case "subscription":
    case "testimonial_submission":
      return;
    default:
      console.info("[Experience Forms] destination", destination, submission.formId);
  }
}

export async function submitExperienceForm(input: {
  form: ExperienceFormDefinition;
  data: Record<string, unknown>;
  store: FormSubmissionStore;
}): Promise<FormSubmitResult> {
  const { form, data, store } = input;
  const errors = validateFormSubmission(form, data);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: form.errorMessage };
  }

  const submission: ExperienceFormSubmission = {
    tenant: form.tenant,
    formId: form._id,
    destination: form.destination,
    data,
    createdAt: new Date().toISOString(),
  };

  await processFormDestination(form.destination, submission);
  const { id } = await store.save(submission);

  return {
    ok: true,
    submissionId: id,
    message: form.successMessage,
  };
}

export function resolveFormId(rawId: string): string {
  const trimmed = rawId.trim();
  if (!trimmed) return trimmed;
  return EXPERIENCE_FORM_ID_ALIASES[trimmed] ?? trimmed;
}
