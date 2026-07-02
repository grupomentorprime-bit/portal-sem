/**
 * Grupos de equipo institucional — admin y portal público.
 */

export const TEAM_GROUP_IDS = ["team_leadership", "team_teaching", "team_technical"] as const;
export type TeamGroupId = (typeof TEAM_GROUP_IDS)[number];

export interface TeamGroupDefinition {
  id: TeamGroupId;
  slug: "leadership" | "teaching" | "technical";
  label: string;
  description: string;
  /** Aparece en el teaser de la home (bloque people) */
  homeTeaser: boolean;
}

export const TEAM_GROUPS: TeamGroupDefinition[] = [
  {
    id: "team_leadership",
    slug: "leadership",
    label: "Equipo directivo y académico",
    description: "Director, subdirector, coordinación académica y autoridades.",
    homeTeaser: true,
  },
  {
    id: "team_teaching",
    slug: "teaching",
    label: "Equipo docente",
    description: "Profesores y formadores de las asignaturas del seminario.",
    homeTeaser: false,
  },
  {
    id: "team_technical",
    slug: "technical",
    label: "Equipo técnico",
    description: "Gestión, admisiones, soporte y acompañamiento administrativo.",
    homeTeaser: false,
  },
];

export function getTeamGroup(id?: string | null): TeamGroupDefinition | undefined {
  if (!id) return undefined;
  return TEAM_GROUPS.find((group) => group.id === id);
}

export function getTeamGroupBySlug(slug?: string | null): TeamGroupDefinition | undefined {
  if (!slug) return undefined;
  return TEAM_GROUPS.find((group) => group.slug === slug);
}

export function getTeamGroupLabel(id?: string | null): string {
  return getTeamGroup(id)?.label ?? "Sin categoría";
}

export const TEAM_GROUP_SELECT_OPTIONS = TEAM_GROUPS.map((group) => ({
  value: group.id,
  label: group.label,
}));
