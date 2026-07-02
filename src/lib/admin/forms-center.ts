/**
 * Centro de formularios — convocatorias, categorías y landings públicas.
 */

export type FormLandingTheme =
  | "convocatoria"
  | "attendance"
  | "absence"
  | "information"
  | "application";

export interface FormLandingHighlight {
  icon: "calendar" | "map-pin" | "users" | "book" | "heart" | "clock" | "sparkles" | "message";
  label: string;
  value: string;
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
      "Confirmación de asistencia a la jornada presencial del viernes 4 de julio de 2026.",
    active: true,
    landing: {
      theme: "convocatoria",
      eyebrow: "Convocatoria presencial",
      headline: "Jornada en Talca Aurora",
      subheadline:
        "Un día de comunión, formación y encuentro presencial. Confirma tu asistencia o justifica tu inasistencia para que podamos preparar todo con excelencia.",
      motivational: "¡Nos encantará verte! Tu presencia fortalece nuestra comunidad formativa.",
      highlights: [
        { icon: "calendar", label: "Fecha", value: "Viernes 4 de julio de 2026" },
        { icon: "map-pin", label: "Lugar", value: "Talca Aurora" },
        { icon: "users", label: "Para quién", value: "Estudiantes, docentes y equipo SEM" },
        { icon: "clock", label: "Horario", value: "Jornada completa — detalles por correo" },
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

export function publicConvocatoriaUrl(slug: string): string {
  return `/formularios/convocatorias/${slug}`;
}

export function attendanceLabel(value: unknown): string {
  if (value === "yes") return "Asistirá";
  if (value === "no") return "No asistirá";
  return "Sin definir";
}
