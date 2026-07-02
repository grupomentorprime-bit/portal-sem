import type { ExperienceFormDefinition } from "@/types/experience-forms";
import type { FieldErrors } from "@/core/experience/forms/validation";

const EXTRA_FIELD_LABELS: Record<string, string> = {
  studentId: "Identificación en el listado",
  fullName: "Nombre completo",
  email: "Correo electrónico",
  phone: "Teléfono",
  attendance: "Confirmación de asistencia",
  justification: "Motivo de inasistencia",
  justificationAttachment: "Justificativo adjunto",
  rut: "RUT",
};

export interface ValidationSummaryItem {
  field: string;
  label: string;
  message: string;
}

export function resolveFormFieldLabel(
  form: ExperienceFormDefinition,
  fieldName: string
): string {
  const field = form.fields.find((item) => item.name === fieldName);
  return field?.label ?? EXTRA_FIELD_LABELS[fieldName] ?? fieldName;
}

export function buildValidationSummaryItems(
  errors: FieldErrors,
  form: ExperienceFormDefinition
): ValidationSummaryItem[] {
  return Object.entries(errors).map(([field, message]) => ({
    field,
    label: resolveFormFieldLabel(form, field),
    message,
  }));
}

export function scrollToFirstFormError(): void {
  requestAnimationFrame(() => {
    const root = document.querySelector(".portal-experience-form");
    if (!root) return;

    const target =
      root.querySelector('[aria-invalid="true"]') ??
      root.querySelector('[data-form-error="true"]');

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
