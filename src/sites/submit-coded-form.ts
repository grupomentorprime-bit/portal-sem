import { validateFormSubmission } from "@/core/experience/forms/validation";
import type { ExperienceFormDefinition, ExperienceFormSubmission } from "@/types/experience-forms";

export interface CodedFormSubmitResult {
  ok: boolean;
  submissionId?: string;
  errors?: Record<string, string>;
  message?: string;
}

type CodedFormStore = {
  save: (submission: ExperienceFormSubmission) => Promise<{ id: string }>;
};

type CodedFormSubmit = (input: {
  form: ExperienceFormDefinition;
  data: Record<string, unknown>;
  store: CodedFormStore;
}) => Promise<CodedFormSubmitResult>;

export async function submitCodedSiteForm(input: {
  form: ExperienceFormDefinition;
  data: Record<string, unknown>;
  store: CodedFormStore;
  submit?: CodedFormSubmit;
}): Promise<CodedFormSubmitResult> {
  const errors = validateFormSubmission(input.form, input.data);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: input.form.errorMessage };
  }
  const submit =
    input.submit ??
    (await import("@/core/experience/forms")).submitExperienceForm;
  return submit({ form: input.form, data: input.data, store: input.store });
}
