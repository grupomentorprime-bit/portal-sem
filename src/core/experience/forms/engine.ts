import type {
  ExperienceFormDefinition,
  ExperienceFormDestination,
  ExperienceFormSubmission,
} from "@/types/experience-forms";
import { EXPERIENCE_FORM_ID_ALIASES } from "@/types/experience-forms";
import {
  isGrowthV1FormDestination,
} from "@/core/growth";
import { ingestFormSubmissionToGrowthSafe } from "@/lib/growth";
import { prepareCumpleDiagnosticoSubmission } from "@/sites/cumple/diagnostico";
import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
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

/**
 * Enruta el envío según destino — Growth Core V1 proyecta contact /
 * information_request / event_registration (después de persistir).
 */
export async function processFormDestination(
  destination: ExperienceFormDestination,
  submission: ExperienceFormSubmission
): Promise<void> {
  if (isGrowthV1FormDestination(destination)) {
    ensureCumpleGrowthAssessmentPort();
    await ingestFormSubmissionToGrowthSafe(submission);
    return;
  }

  switch (destination) {
    case "attendance_confirmation":
    case "absence_justification":
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
  const prepared = prepareCumpleDiagnosticoSubmission(form._id, data);
  if (prepared.applies && !prepared.ok) {
    return { ok: false, errors: prepared.errors, message: form.errorMessage };
  }
  const submissionData = prepared.applies && prepared.ok ? prepared.data : data;
  const errors = validateFormSubmission(form, submissionData);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: form.errorMessage };
  }

  const submission: ExperienceFormSubmission = {
    tenant: form.tenant,
    formId: form._id,
    destination: form.destination,
    data: submissionData,
    createdAt: new Date().toISOString(),
  };

  // ADR-010 §4.1 — persistir fuente primero; luego proyectar a Growth.
  const { id } = await store.save(submission);
  submission._id = id;
  await processFormDestination(form.destination, submission);

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
