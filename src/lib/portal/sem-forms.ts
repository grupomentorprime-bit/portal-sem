import type { FormLandingConfig } from "@/lib/admin/forms-center";
import { createSemDefaultForms, SEM_DEFAULT_FORM_IDS } from "@/core/experience/forms/defaults";
import { SEM_TENANT_ID } from "@/core/tenant/constants";
import {
  registerFormCatalog,
  type GenerationOption,
  type SpecializedFormCatalog,
} from "@/nelzuri";

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
    active: false,
    landing: {
      theme: "convocatoria",
      eyebrow: "Convocatoria presencial · evaluación",
      headline: "Jornada de evaluación en Talca Aurora",
      subheadline:
        "Un día de evaluación académica, comunión, formación y encuentro presencial. Confirma tu asistencia o justifica tu inasistencia para que podamos preparar todo con excelencia.",
      motivational: "¡Nos encantará verte! Tu presencia fortalece nuestra comunidad formativa.",
      highlights: [
        { icon: "calendar", label: "Fecha", value: "Sábado 4 de julio de 2026" },
        { icon: "clock", label: "Horario", value: "Desde las 9:00 am — incluye evaluación académica" },
        {
          icon: "map-pin",
          label: "Lugar",
          value: "Talca Aurora",
          href: "https://maps.app.goo.gl/mMieKcyFbgz9iKAF9",
        },
        { icon: "users", label: "Para quién", value: "Estudiantes, docentes y equipo SEM" },
      ],
      ctaLabel: "Enviar mi respuesta",
    },
  },
  {
    slug: "talca-aurora-nov-2026",
    formId: "convocatoria-talca-aurora-nov-2026",
    title: "Cierre del año académico — Talca Aurora",
    date: "2026-11-07",
    location: "Talca Aurora",
    description:
      "Confirmación de asistencia al cierre del año académico 2026 el sábado 7 de noviembre en Talca Aurora.",
    active: true,
    landing: {
      theme: "convocatoria",
      eyebrow: "Convocatoria presencial · cierre académico",
      headline: "Cierre del año académico en Talca Aurora",
      subheadline:
        "Celebramos juntos el cierre del año académico 2026: comunión, formación y encuentro presencial. Confirma tu asistencia o justifica tu inasistencia para preparar todo con excelencia.",
      motivational:
        "¡Nos encantará verte! Tu presencia fortalece nuestra comunidad formativa.",
      highlights: [
        {
          icon: "calendar",
          label: "Fecha",
          value: "Sábado 7 de noviembre de 2026",
        },
        {
          icon: "clock",
          label: "Horario",
          value: "Desde las 9:00 am — cierre del año académico",
        },
        {
          icon: "map-pin",
          label: "Lugar",
          value: "Talca Aurora",
          href: "https://maps.app.goo.gl/mMieKcyFbgz9iKAF9",
        },
        {
          icon: "users",
          label: "Para quién",
          value: "Estudiantes, docentes y equipo SEM",
        },
      ],
      ctaLabel: "Enviar mi respuesta",
    },
  },
];

export const SEM_CONVOCATORIA_GENERATIONS: GenerationOption[] = [
  {
    value: "G-2023",
    label: "Diploma Teología Bíblica — G-2023 (Pastores(as))",
  },
  {
    value: "G-2024",
    label: "Diploma Teología Bíblica — G-2024",
  },
  {
    value: "G-2025",
    label: "Diploma Teología Bíblica — G-2025",
  },
  {
    value: "G-2026",
    label: "Diploma Teología Bíblica — G-2026",
  },
  {
    value: "staff",
    label: "Equipo docente / administrativo",
  },
  {
    value: "other",
    label: "Otros",
  },
];

export const SEM_GENERATION_ALIASES: Record<string, string> = {
  g2023: "G-2023",
  "g-2023": "G-2023",
  "g2023-pastoral": "G-2023",
  "diploma-teologia-biblica-pastoral-g2023": "G-2023",
  g2024: "G-2024",
  "g-2024": "G-2024",
  "diploma-teologia-biblica-pastores-g2024": "G-2024",
  g2025: "G-2025",
  "g-2025": "G-2025",
  "diploma-teologia-biblica-hermanos-g2025": "G-2025",
  g2026: "G-2026",
  "g-2026": "G-2026",
  "diploma-teologia-biblica-hermanos-g2026": "G-2026",
  staff: "staff",
  "equipo docente / administrativo": "staff",
  "equipo docente": "staff",
  other: "other",
  otro: "other",
};

export function semConvocatoriaByFormId(formId: string): FormConvocatoria | undefined {
  return FORM_CONVOCATORIAS.find((item) => item.formId === formId);
}

const SEM_FORM_CATALOG: SpecializedFormCatalog = {
  spaceId: SEM_TENANT_ID,
  convocatorias: FORM_CONVOCATORIAS,
  generations: SEM_CONVOCATORIA_GENERATIONS,
  aliases: SEM_GENERATION_ALIASES,
  createForms: (tenant: string) => createSemDefaultForms(tenant),
  defaultFormIds: SEM_DEFAULT_FORM_IDS,
  supersededFormIds: ["attendance-confirmation"],
};

export function registerSemFormCatalog(): void {
  registerFormCatalog(SEM_FORM_CATALOG);
}
