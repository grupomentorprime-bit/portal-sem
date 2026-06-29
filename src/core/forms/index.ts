export interface FormDefinition {
  id: string;
  tenantId: string;
  name: string;
  fields: Array<{ id: string; type: string; label: string; required?: boolean }>;
}

export interface FormSubmission {
  tenantId: string;
  formId: string;
  data: Record<string, unknown>;
}

export interface FormService {
  getForm(tenantId: string, formId: string): Promise<FormDefinition | null>;
  submit(submission: FormSubmission): Promise<{ id: string }>;
}
