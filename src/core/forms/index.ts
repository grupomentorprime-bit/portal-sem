/**
 * @deprecated Usar `@/core/experience/forms` — ver docs/core/CORE-EXPERIENCE-FORMS-v1.md
 */

export type {
  ExperienceFormDefinition as FormDefinition,
  ExperienceFormSubmission as FormSubmission,
} from "@/types/experience-forms";

export {
  submitExperienceForm,
  validateFormSubmission,
  type FormSubmitResult,
  type FormSubmissionStore,
} from "@/core/experience/forms";

/** @deprecated Interface legacy — usar repository + submitExperienceForm */
export interface FormService {
  getForm(tenantId: string, formId: string): Promise<import("@/types/experience-forms").ExperienceFormDefinition | null>;
  submit(submission: import("@/types/experience-forms").ExperienceFormSubmission): Promise<{ id: string }>;
}
