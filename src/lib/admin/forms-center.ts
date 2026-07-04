/**
 * Centro de formularios — convocatorias, categorías y landings públicas.
 */

import { formatGenerationDisplay } from "@/lib/experience/forms/generations";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import {
  isExperienceFormPrivate,
  isPrivateExperienceFormId,
} from "@/lib/experience/forms/status";
import {
  formatChilePhoneDisplay,
  isValidChilePhone,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";

export type FormLandingTheme =
  | "convocatoria"
  | "attendance"
  | "absence"
  | "information"
  | "application"
  | "testimonial";

export interface FormLandingHighlight {
  icon: "calendar" | "map-pin" | "users" | "book" | "heart" | "clock" | "sparkles" | "message";
  label: string;
  value: string;
  href?: string;
}

export interface FormLandingConfig {
  formId: string;
  theme: FormLandingTheme;
  eyebrow: string;
  headline: string;
  subheadline: string;
  motivational?: string;
  highlights: FormLandingHighlight[];
  ctaLabel?: string;
}

export interface FormConvocatoria {
  slug: string;
  formId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  active: boolean;
  landing?: Omit<FormLandingConfig, "formId">;
}

export const FORM_CONVOCATORIAS: FormConvocatoria[] = [
  {
    slug: "talca-aurora-jul-2026",
    formId: "convocatoria-talca-aurora-jul-2026",
    title: "Jornada Presencial — Talca Aurora",
    date: "2026-07-04",
    location: "Talca Aurora",
    description:
      "Confirmación de asistencia a la jornada presencial de evaluación del sábado 4 de julio de 2026.",
    active: true,
    landing: {
      theme: "convocatoria",
      eyebrow: "Convocatoria presencial · evaluación",
      headline: "Jornada de evaluación en Talca Aurora",
      subheadline:
        "Un día de evaluación académica, comunión, formación y encuentro presencial. Confirma tu asistencia o justifica tu inasistencia para que podamos preparar todo con excelencia.",
      motivational: "¡Nos encantará verte! Tu presencia fortalece nuestra comunidad formativa.",
      highlights: [
        { icon: "calendar", label: "Fecha", value: "Sábado 4 de julio de 2026" },
        {
          icon: "map-pin",
          label: "Lugar",
          value: "Talca Aurora",
          href: "https://www.google.com/maps/search/?api=1&query=Aurora+Talca+Chile",
        },
        { icon: "users", label: "Para quién", value: "Estudiantes, docentes y equipo SEM" },
        { icon: "clock", label: "Horario", value: "Desde las 9:00 am — incluye evaluación académica" },
      ],
      ctaLabel: "Enviar mi respuesta",
    },
  },
];

/** Landings para formularios generales (no convocatoria). */
export const FORM_LANDINGS: FormLandingConfig[] = [
  {
    formId: "attendance-confirmation",
    theme: "attendance",
    eyebrow: "Confirmación de asistencia",
    headline: "¡Te esperamos en la jornada!",
    subheadline:
      "Confirma tu participación en la próxima jornada presencial. Tu respuesta nos ayuda a organizar espacios, materiales y la mejor experiencia para todos.",
    motivational: "Cada encuentro presencial es una oportunidad de crecer juntos en la fe y el servicio.",
    highlights: [
      { icon: "sparkles", label: "Qué incluye", value: "Formación, comunión y actividades grupales" },
      { icon: "users", label: "Comunidad", value: "Encuentro con compañeros de generación" },
      { icon: "book", label: "Formación", value: "Sesiones académicas y espirituales" },
    ],
    ctaLabel: "Confirmar asistencia",
  },
  {
    formId: "absence-justification",
    theme: "absence",
    eyebrow: "Justificación de inasistencia",
    headline: "Entendemos que a veces no puedes asistir",
    subheadline:
      "Si no podrás participar en una actividad programada, cuéntanos el motivo. El equipo académico revisará tu justificación con empatía y prontitud.",
    motivational: "Tu comunicación oportuna nos permite acompañarte mejor en tu proceso formativo.",
    highlights: [
      { icon: "message", label: "Proceso", value: "Revisión por el equipo académico" },
      { icon: "clock", label: "Plazo", value: "Antes o durante la actividad programada" },
      { icon: "heart", label: "Acompañamiento", value: "Estamos para apoyarte en tu camino" },
    ],
    ctaLabel: "Enviar justificación",
  },
  {
    formId: "information-request",
    theme: "information",
    eyebrow: "Solicitud de información",
    headline: "¿Tienes preguntas? Estamos aquí",
    subheadline:
      "Solicita información sobre programas, admisión, becas o actividades del Seminario. Te responderemos personalmente a la brevedad.",
    motivational: "Dar el primer paso es más fácil cuando tienes claridad. Escríbenos sin compromiso.",
    highlights: [
      { icon: "book", label: "Programas", value: "Diplomas y formación bíblica" },
      { icon: "sparkles", label: "Admisión", value: "Proceso, fechas y requisitos" },
      { icon: "message", label: "Respuesta", value: "Contacto directo con nuestro equipo" },
    ],
    ctaLabel: "Enviar solicitud",
  },
  {
    formId: "program-application",
    theme: "application",
    eyebrow: "Postulación al programa",
    headline: "Da el paso hacia tu formación",
    subheadline:
      "Inicia tu postulación a un programa formativo del Seminario Eclesiástico Mayor. Este es el comienzo de un camino de crecimiento teológico y ministerial.",
    motivational: "Tu llamado al servicio merece una formación sólida. ¡Comienza hoy!",
    highlights: [
      { icon: "book", label: "Formación", value: "Teología bíblica de excelencia" },
      { icon: "users", label: "Comunidad", value: "Red de pastores y líderes" },
      { icon: "sparkles", label: "Siguiente paso", value: "Proceso de admisión guiado" },
    ],
    ctaLabel: "Iniciar postulación",
  },
  {
    formId: "testimonial-submission",
    theme: "testimonial",
    eyebrow: "Voces de nuestra comunidad",
    headline: "Comparte tu experiencia en el SEM",
    subheadline:
      "Tu testimonio ayuda a otros a conocer la formación del seminario. Revisaremos tu respuesta antes de publicarla en el sitio.",
    motivational: "Cada historia formativa fortalece nuestra comunidad.",
    highlights: [
      { icon: "heart", label: "Revisión", value: "El equipo editorial valida cada testimonio" },
      { icon: "users", label: "Privacidad", value: "Tu correo no se publica" },
      { icon: "message", label: "Formato", value: "Textos breves que caben en el carrusel de Home" },
    ],
    ctaLabel: "Enviar testimonio",
  },
];

export const FORM_CENTER_CATEGORIES = [
  {
    id: "convocatorias",
    label: "Convocatorias",
    description: "Confirmaciones de asistencia y justificaciones de inasistencia.",
  },
  {
    id: "admision",
    label: "Admisión e interés",
    description: "Postulaciones y solicitudes de información.",
    formIds: ["program-application", "information-request"],
  },
  {
    id: "comunidad",
    label: "Comunidad",
    description: "Testimonios de alumnos y voces de la comunidad formativa.",
    formIds: ["testimonial-submission"],
  },
  {
    id: "general",
    label: "Formularios generales",
    description: "Contacto, asistencia y otros formularios del portal.",
    formIds: ["attendance-confirmation", "absence-justification"],
  },
] as const;

export function getConvocatoriaBySlug(slug: string): FormConvocatoria | undefined {
  return FORM_CONVOCATORIAS.find((item) => item.slug === slug);
}

export function getConvocatoriaByFormId(formId: string): FormConvocatoria | undefined {
  return FORM_CONVOCATORIAS.find((item) => item.formId === formId);
}

export function getActiveConvocatoria(): FormConvocatoria | undefined {
  return FORM_CONVOCATORIAS.find((item) => item.active);
}

export function activeConvocatoriaFormUrl(): string | null {
  const convocatoria = getActiveConvocatoria();
  return convocatoria ? publicFormUrl(convocatoria.formId) : null;
}

export function getFormLandingByFormId(formId: string): FormLandingConfig | undefined {
  const convocatoria = getConvocatoriaByFormId(formId);
  if (convocatoria?.landing) {
    return { formId, ...convocatoria.landing };
  }
  return FORM_LANDINGS.find((item) => item.formId === formId);
}

export function formatConvocatoriaDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function publicFormUrl(formId: string): string {
  return `/formularios/${formId}`;
}

/** URL pública canónica de una convocatoria (mismo destino que publicFormUrl). */
export function publicConvocatoriaUrl(slug: string): string {
  const convocatoria = getConvocatoriaBySlug(slug);
  if (convocatoria) return publicFormUrl(convocatoria.formId);
  return `/formularios/${slug}`;
}

/** IDs de formularios plantilla sustituidos por una convocatoria activa publicada. */
export function getSupersededFormIds(): Set<string> {
  const active = getActiveConvocatoria();
  if (!active) return new Set();
  return new Set(["attendance-confirmation"]);
}

export {
  isExperienceFormArchived,
  isExperienceFormPublished,
  isExperienceFormPrivate,
  isPrivateExperienceFormId,
  PRIVATE_EXPERIENCE_FORM_IDS,
} from "@/lib/experience/forms/status";

export const PRIVATE_EXPERIENCE_FORM_LABEL = "Formulario privado";

export function isExperienceFormPrivateById(formId: string): boolean {
  return isPrivateExperienceFormId(formId);
}

export function attendanceLabel(value: unknown): string {
  if (value === "yes") return "Asistirá";
  if (value === "no") return "No asistirá";
  return "Sin definir";
}

export const ABSENCE_REVIEW_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente de revisión" },
  { value: "approved", label: "Fuerza mayor aceptada" },
  { value: "rejected", label: "No procede" },
] as const;

export const ABSENCE_REVIEW_POLICY =
  "Las inasistencias solo se justifican por causa de fuerza mayor (enfermedad grave, duelo, emergencia familiar u otra situación equivalente) y deben respaldarse con documentación verificable.";

export const TESTIMONIAL_REVIEW_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente de revisión" },
  { value: "approved", label: "Aprobado (sin publicar aún)" },
  { value: "rejected", label: "No publicar" },
  { value: "published", label: "Publicado en Home" },
] as const;

export const TESTIMONIAL_REVIEW_POLICY =
  "Revisa el testimonio, edita si es necesario y elige qué datos se publican. El correo del alumno permanece interno. Publicar en Home crea un testimonio en el CMS.";

export function testimonialReviewStatusLabel(status?: string): string {
  return (
    TESTIMONIAL_REVIEW_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Pendiente de revisión"
  );
}

export function isTestimonialSubmissionForm(formId: string): boolean {
  return formId === "testimonial-submission";
}

export function isPrivateExperienceForm(form: Pick<ExperienceFormDefinition, "_id" | "private">): boolean {
  return isExperienceFormPrivate(form);
}

export function absenceReviewStatusLabel(status?: string): string {
  return (
    ABSENCE_REVIEW_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Pendiente de revisión"
  );
}

export function formatSubmissionProgram(value: unknown): string {
  return formatGenerationDisplay(value);
}

export function formatSubmissionPhone(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (isValidChilePhone(raw)) return normalizeChilePhone(raw) ?? formatChilePhoneDisplay(raw);
  return formatChilePhoneDisplay(raw) || raw;
}

export function getSubmissionGeneration(data: Record<string, unknown>): string {
  return formatSubmissionProgram(data.generation ?? data.program);
}
