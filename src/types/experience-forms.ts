/** Experience Framework — Forms v1.0 (LOCKED) */

import type { ExperienceAction } from "@/types/experience-action";

export const EXPERIENCE_FORM_FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "date",
  "time",
  "file",
  "hidden",
] as const;

export type ExperienceFormFieldType = (typeof EXPERIENCE_FORM_FIELD_TYPES)[number];

export const EXPERIENCE_FORM_DESTINATIONS = [
  "contact",
  "information_request",
  "attendance_confirmation",
  "absence_justification",
  "event_registration",
  "subscription",
  "testimonial_submission",
] as const;

export type ExperienceFormDestination = (typeof EXPERIENCE_FORM_DESTINATIONS)[number];

export const EXPERIENCE_FORM_POST_ACTIONS = [
  "message",
  "redirect",
  "modal",
  "download",
  "page",
  "whatsapp",
] as const;

export type ExperienceFormPostAction = (typeof EXPERIENCE_FORM_POST_ACTIONS)[number];

export interface ExperienceFormFieldOption {
  label: string;
  value: string;
}

export interface ExperienceFormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ExperienceFormField {
  id: string;
  type: ExperienceFormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  helper?: string;
  defaultValue?: string;
  options?: ExperienceFormFieldOption[];
  validation?: ExperienceFormFieldValidation;
  visible?: boolean;
}

export interface ExperienceFormPostSubmit {
  type: ExperienceFormPostAction;
  message?: string;
  action?: ExperienceAction;
}

export interface ExperienceFormDefinition {
  _id: string;
  tenant: string;
  name: string;
  description?: string;
  successMessage: string;
  errorMessage: string;
  destination: ExperienceFormDestination;
  postSubmit: ExperienceFormPostSubmit;
  fields: ExperienceFormField[];
  active: boolean;
  visible: boolean;
  /** Accesible solo por URL directa; no aparece en /formularios ni en bloques públicos. */
  private?: boolean;
  /** Marcado al archivar; distingue borradores nuevos de formularios retirados. */
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExperienceFormCreate = Omit<
  ExperienceFormDefinition,
  "createdAt" | "updatedAt"
>;

export type ExperienceFormUpdate = Partial<
  Omit<ExperienceFormDefinition, "_id" | "tenant" | "createdAt">
>;

export interface ExperienceFormSubmission {
  _id?: string;
  tenant: string;
  formId: string;
  destination: ExperienceFormDestination;
  data: Record<string, unknown>;
  /** Seguimiento institucional cuando el participante declara inasistencia. */
  absenceReview?: ExperienceFormAbsenceReview;
  /** Registro de llegada el día de la jornada (check-in presencial). */
  dayCheckIn?: ExperienceFormDayCheckIn;
  /** Historial de contactos del equipo con el participante (inasistencias). */
  absenceContactLog?: AbsenceContactLogEntry[];
  /** Moderación editorial de testimonios enviados por alumnos. */
  testimonialReview?: ExperienceFormTestimonialReview;
  createdAt: string;
}

export const ABSENCE_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export type AbsenceReviewStatus = (typeof ABSENCE_REVIEW_STATUSES)[number];

export interface ExperienceFormDayCheckIn {
  present: boolean;
  checkedInAt?: string;
  checkedInByName?: string;
  notes?: string;
}

export interface ExperienceFormAbsenceReview {
  status: AbsenceReviewStatus;
  /** Gestiones realizadas por el equipo (comunicaciones, seguimiento, etc.). */
  managementNotes?: string;
  /** Si se recibió respaldo documental de fuerza mayor. */
  evidenceReceived?: boolean;
  /** Detalle del respaldo recibido (certificado, carta, etc.). */
  evidenceNotes?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  /** Cuándo se notificó al participante (correo o contacto) para justificar. */
  justificationRequestedAt?: string;
  /** Plazo límite para que el participante envíe su justificación. */
  justificationDeadlineAt?: string;
}

export const ABSENCE_CONTACT_CHANNELS = [
  "email",
  "phone",
  "whatsapp",
  "in-person",
  "other",
] as const;

export type AbsenceContactChannel = (typeof ABSENCE_CONTACT_CHANNELS)[number];

export const ABSENCE_CONTACT_OUTCOMES = [
  "reached",
  "no-answer",
  "invalid-number",
  "other",
] as const;

export type AbsenceContactOutcome = (typeof ABSENCE_CONTACT_OUTCOMES)[number];

export interface AbsenceContactLogEntry {
  id: string;
  channel: AbsenceContactChannel;
  contactedAt: string;
  operatorName?: string;
  notes?: string;
  /** Si este contacto inició el plazo de 3 días para justificar. */
  startedJustificationDeadline?: boolean;
  /** Resultado del intento de contacto (útil cuando no hubo respuesta). */
  contactOutcome?: AbsenceContactOutcome;
  email?: string;
  phone?: string;
}

export const TESTIMONIAL_REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "published",
] as const;

export type TestimonialReviewStatus = (typeof TESTIMONIAL_REVIEW_STATUSES)[number];

export interface ExperienceFormTestimonialReview {
  status: TestimonialReviewStatus;
  /** Publicar la cita en el sitio */
  publishQuote?: boolean;
  /** Publicar nombre y título */
  publishAuthor?: boolean;
  /** Publicar generación */
  publishGeneration?: boolean;
  /** Publicar iglesia o comunidad y ciudad */
  publishAffiliation?: boolean;
  /** Texto editado por el equipo antes de publicar */
  editedQuote?: string;
  editedAuthor?: string;
  editedRole?: string;
  editedProgram?: string;
  /** ID en academy_testimonials cuando ya se publicó */
  publishedTestimonialId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedByName?: string;
}

export interface ExperienceFormBlockSettings extends Record<string, unknown> {
  formId?: string;
  overline?: string;
  title?: string;
  description?: string;
  display?: "inline" | "modal";
}

/** Alias CMS → formulario canónico */
export const EXPERIENCE_FORM_ID_ALIASES: Record<string, string> = {
  contact: "information-request",
};
