import type { AdmissionConfig, AdmissionSectionId } from "@/types/admission";

export interface AdmissionSectionMetaUI {
  description: string;
  group: "landing" | "info" | "conversion";
}

export const ADMISSION_SECTION_GROUPS = [
  { id: "landing" as const, label: "Landing" },
  { id: "info" as const, label: "Información" },
  { id: "conversion" as const, label: "Postulación" },
];

export const ADMISSION_SECTION_META: Record<AdmissionSectionId, AdmissionSectionMetaUI> = {
  hero: {
    description: "Hero, CTAs, imagen y barra de fechas destacadas",
    group: "landing",
  },
  programs: {
    description: "Showcase de programas con filtros y tarjetas",
    group: "landing",
  },
  why_study: {
    description: "Propuesta de valor y motivos para estudiar",
    group: "info",
  },
  profiles: {
    description: "Perfiles de postulante y audiencias",
    group: "info",
  },
  requirements: {
    description: "Requisitos para postular",
    group: "info",
  },
  dates: {
    description: "Calendario académico y fechas clave",
    group: "info",
  },
  documents: {
    description: "Documentación requerida",
    group: "info",
  },
  timeline: {
    description: "Pasos del proceso de admisión",
    group: "info",
  },
  fees: {
    description: "Aranceles y costos de formación",
    group: "conversion",
  },
  scholarships: {
    description: "Becas y beneficios económicos",
    group: "conversion",
  },
  form: {
    description: "Formulario de postulación",
    group: "conversion",
  },
  faq: {
    description: "Preguntas frecuentes",
    group: "conversion",
  },
  closing: {
    description: "Cierre institucional editorial",
    group: "conversion",
  },
};

export function getAdmissionPreviewAnchor(
  config: AdmissionConfig,
  sectionId: AdmissionSectionId
): string {
  return config.sectionSeo?.[sectionId]?.anchor ?? sectionId;
}

export function getAdmissionPreviewUrl(
  config: AdmissionConfig,
  sectionId: AdmissionSectionId
): string {
  const anchor = getAdmissionPreviewAnchor(config, sectionId);
  return `/admision#${anchor}`;
}
