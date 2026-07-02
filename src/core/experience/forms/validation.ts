import type {
  ExperienceFormDefinition,
  ExperienceFormField,
  ExperienceFormFieldType,
} from "@/types/experience-forms";

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s+()-]{6,20}$/;

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "";
  return String(value).trim();
}

function validateByType(type: ExperienceFormFieldType, value: string): string | null {
  switch (type) {
    case "email":
      return value && !EMAIL_RE.test(value) ? "Correo electrónico inválido" : null;
    case "phone":
      return value && !PHONE_RE.test(value) ? "Teléfono inválido" : null;
    case "number": {
      if (!value) return null;
      const n = Number(value);
      return Number.isNaN(n) ? "Debe ser un número válido" : null;
    }
    case "date":
      return value && Number.isNaN(Date.parse(value)) ? "Fecha inválida" : null;
    case "time":
      return value && !/^\d{2}:\d{2}(:\d{2})?$/.test(value) ? "Hora inválida" : null;
    case "file":
      return null;
    default:
      return null;
  }
}

export function validateFormField(
  field: ExperienceFormField,
  rawValue: unknown
): string | null {
  if (field.visible === false || field.type === "hidden") return null;

  const value = field.type === "checkbox" ? rawValue : asString(rawValue);
  const rules = field.validation ?? {};
  const required = rules.required ?? false;

  if (field.type === "checkbox") {
    if (required && !rawValue) return "Este campo es obligatorio";
    return null;
  }

  const str = asString(value);

  if (required && !str) return "Este campo es obligatorio";
  if (!str) return null;

  if (rules.minLength !== undefined && str.length < rules.minLength) {
    return `Mínimo ${rules.minLength} caracteres`;
  }
  if (rules.maxLength !== undefined && str.length > rules.maxLength) {
    return `Máximo ${rules.maxLength} caracteres`;
  }
  if (rules.pattern) {
    try {
      if (!new RegExp(rules.pattern).test(str)) return "Formato inválido";
    } catch {
      /* ignore invalid pattern */
    }
  }
  if (rules.min !== undefined && Number(str) < rules.min) {
    return `El valor mínimo es ${rules.min}`;
  }
  if (rules.max !== undefined && Number(str) > rules.max) {
    return `El valor máximo es ${rules.max}`;
  }

  return validateByType(field.type, str);
}

export function validateFormSubmission(
  form: ExperienceFormDefinition,
  data: Record<string, unknown>
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of form.fields) {
    if (field.visible === false) continue;
    const error = validateFormField(field, data[field.name]);
    if (error) errors[field.name] = error;
  }

  return applyConditionalFormRules(form, data, errors);
}

/** Reglas cruzadas entre campos (p. ej. justificación obligatoria si no asiste). */
function applyConditionalFormRules(
  form: ExperienceFormDefinition,
  data: Record<string, unknown>,
  errors: FieldErrors
): FieldErrors {
  const hasAttendance = form.fields.some((field) => field.name === "attendance");
  if (!hasAttendance) return errors;

  const attendance = asString(data.attendance);
  if (attendance === "no") {
    const justification = asString(data.justification);
    if (!justification || justification.length < 10) {
      errors.justification =
        "Debe indicar el motivo de su inasistencia (mínimo 10 caracteres).";
    }
  }

  return errors;
}
