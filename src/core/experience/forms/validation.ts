import type {
  ExperienceFormDefinition,
  ExperienceFormField,
  ExperienceFormFieldType,
} from "@/types/experience-forms";
import {
  buildTestimonialAuthor,
  buildTestimonialProgram,
  TESTIMONIAL_FORM_LIMITS,
} from "@/lib/experience/forms/testimonial-limits";
import { hasJustificationAttachment } from "@/lib/experience/forms/attachments";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      if (!value) return null;
      return isValidChilePhone(value) ? null : CHILE_PHONE_INVALID_MESSAGE;
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

function applyTestimonialFormRules(
  form: ExperienceFormDefinition,
  data: Record<string, unknown>,
  errors: FieldErrors
): FieldErrors {
  const isTestimonial = form.fields.some((field) => field.name === "churchSection");
  if (!isTestimonial) return errors;

  const author = buildTestimonialAuthor(data.honorific, data.fullName);
  if (author.length > TESTIMONIAL_FORM_LIMITS.author) {
    errors.fullName = `Nombre y título combinados: máximo ${TESTIMONIAL_FORM_LIMITS.author} caracteres.`;
  }

  const program = buildTestimonialProgram(data.churchSection, data.city);
  if (program.length > TESTIMONIAL_FORM_LIMITS.program) {
    errors.city = `Iglesia y ciudad combinadas: máximo ${TESTIMONIAL_FORM_LIMITS.program} caracteres.`;
  }

  return errors;
}

export function normalizeFormSubmissionData(
  form: ExperienceFormDefinition,
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized = { ...data };
  const phoneField = form.fields.find((field) => field.name === "phone" && field.type === "phone");
  if (phoneField) {
    const rawPhone = asString(data.phone);
    if (rawPhone) {
      normalized.phone = normalizeChilePhone(rawPhone) ?? rawPhone;
    }
  }
  return normalized;
}

/** Reglas cruzadas entre campos (p. ej. justificación obligatoria si no asiste). */
function applyConditionalFormRules(
  form: ExperienceFormDefinition,
  data: Record<string, unknown>,
  errors: FieldErrors
): FieldErrors {
  let next = applyTestimonialFormRules(form, data, errors);

  const hasAttendance = form.fields.some((field) => field.name === "attendance");
  if (!hasAttendance) return next;

  const hasRosterLookup =
    form.fields.some((field) => field.name === "studentId") ||
    form.fields.some((field) => field.name === "eventId" && field.type === "hidden");
  if (hasRosterLookup) {
    const registrationMode = asString(data.registrationMode);
    const studentId = asString(data.studentId);

    if (registrationMode === "manual") {
      if (!asString(data.fullName)) {
        next.fullName = "Debe indicar su nombre completo.";
      }
    } else if (!studentId) {
      next.studentId =
        "Busca tu nombre en el listado o usa la opción de registro manual si no apareces.";
    }
  }

  const attendance = asString(data.attendance);
  if (attendance === "no") {
    const justification = asString(data.justification);
    if (!justification || justification.length < 10) {
      next.justification =
        "Debe explicar el motivo de inasistencia por fuerza mayor (mínimo 10 caracteres).";
    }

    if (!hasJustificationAttachment(data)) {
      next.justificationAttachment = "Debe adjuntar un justificativo de respaldo (PDF o imagen).";
    }
  } else {
    delete next.justification;
    delete next.justificationAttachment;
  }

  return next;
}
