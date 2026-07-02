/** OT-PORTAL-015 — Agenda Académica y Avisos Institucionales */

export const ACADEMIC_AGENDA_CATEGORIES = [
  { value: "convocatoria_admision", label: "Convocatoria de Admisión" },
  { value: "matriculas", label: "Matrículas" },
  { value: "inicio_clases", label: "Inicio de clases" },
  { value: "calendario_academico", label: "Calendario Académico" },
  { value: "evaluaciones_presenciales", label: "Evaluaciones Presenciales" },
  { value: "examenes", label: "Exámenes" },
  { value: "entrega_trabajos", label: "Entrega de trabajos" },
  { value: "cierre_semestre", label: "Cierre de semestre" },
  { value: "graduacion", label: "Graduación" },
  { value: "receso_academico", label: "Receso Académico" },
  { value: "otros", label: "Otros hitos académicos" },
] as const;

export type AcademicAgendaCategory = (typeof ACADEMIC_AGENDA_CATEGORIES)[number]["value"];

export const INSTITUTIONAL_NOTICE_CATEGORIES = [
  { value: "admision", label: "Admisión" },
  { value: "becas", label: "Becas" },
  { value: "comunicados", label: "Comunicados" },
  { value: "direccion", label: "Dirección" },
  { value: "secretaria_academica", label: "Secretaría Académica" },
  { value: "tesoreria", label: "Tesorería" },
  { value: "biblioteca", label: "Biblioteca" },
  { value: "plataforma_virtual", label: "Plataforma Virtual" },
  { value: "reglamentos", label: "Reglamentos" },
  { value: "informacion_general", label: "Información General" },
] as const;

export type InstitutionalNoticeCategory =
  (typeof INSTITUTIONAL_NOTICE_CATEGORIES)[number]["value"];

export function academicAgendaCategoryLabel(value: string): string {
  return ACADEMIC_AGENDA_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function institutionalNoticeCategoryLabel(value: string): string {
  return INSTITUTIONAL_NOTICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
