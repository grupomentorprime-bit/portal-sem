/**
 * Categorías base de organización al crear un Espacio (Growth OS horizontal).
 * No limitan capacidades: solo clasifican el Espacio para UX / futura config inicial.
 * Valores legacy (`institution`, `academy`, `platform`) siguen válidos en lectura.
 */
export const SPACE_ORGANIZATION_TYPES = [
  { value: "business", label: "Empresa" },
  { value: "education", label: "Educación" },
  { value: "social", label: "Organización social" },
  { value: "community", label: "Comunidad o iglesia" },
  { value: "independent", label: "Profesional independiente" },
  { value: "other", label: "Otro" },
] as const;

export type SpaceOrganizationType =
  (typeof SPACE_ORGANIZATION_TYPES)[number]["value"];

/** Tipos aceptados al crear Espacio desde Platform Admin. */
export const SPACE_CREATION_ALLOWED_TYPES = new Set<string>([
  ...SPACE_ORGANIZATION_TYPES.map((t) => t.value),
  // Legacy (compatibilidad con contratos / datos previos)
  "institution",
  "academy",
]);

export function isSpaceCreationType(value: string): boolean {
  return SPACE_CREATION_ALLOWED_TYPES.has(value);
}
