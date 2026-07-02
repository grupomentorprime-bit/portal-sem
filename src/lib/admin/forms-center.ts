/**
 * Centro de formularios — convocatorias y categorías institucionales.
 */

export interface FormConvocatoria {
  slug: string;
  formId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  active: boolean;
}

export const FORM_CONVOCATORIAS: FormConvocatoria[] = [
  {
    slug: "talca-aurora-jul-2025",
    formId: "convocatoria-talca-aurora-jul-2025",
    title: "Jornada Presencial — Talca Aurora",
    date: "2025-07-04",
    location: "Talca Aurora",
    description:
      "Confirmación de asistencia a la jornada presencial del viernes 4 de julio de 2025.",
    active: true,
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

export function attendanceLabel(value: unknown): string {
  if (value === "yes") return "Asistirá";
  if (value === "no") return "No asistirá";
  return "Sin definir";
}
