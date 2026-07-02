import type { ProgramItem } from "@/types/content";
import type {
  ProgramsShowcaseConfig,
  ProgramsShowcaseFilter,
} from "@/types/programs-showcase";
import type { ProgramPremiumFilter } from "@/lib/portal/program-premium-config";

function programSearchText(program: ProgramItem): string {
  return [
    program.title,
    program.category,
    program.certification,
    program.modality,
    ...(program.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildProgramsShowcaseMatcher(
  filter: ProgramsShowcaseFilter
): (program: ProgramItem) => boolean {
  switch (filter.matchKind) {
    case "all":
      return () => true;
    case "status":
      return (program) => program.status === filter.matchValue;
    case "category":
    case "text":
      if (!filter.matchValue?.trim()) return () => true;
      return (program) =>
        new RegExp(filter.matchValue!, "i").test(programSearchText(program));
    default:
      return () => true;
  }
}

export function toShowcasePremiumFilters(
  filters: ProgramsShowcaseFilter[] | undefined
): ProgramPremiumFilter[] {
  const visible = [...(filters ?? [])]
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return visible.map((filter) => ({
    id: filter.id,
    label: filter.label,
    match: buildProgramsShowcaseMatcher(filter),
  }));
}

export function shouldShowProgramsShowcaseFilters(
  programs: ProgramItem[],
  config: ProgramsShowcaseConfig
): boolean {
  const threshold = config.minProgramsForFilters ?? 8;
  if (programs.length < threshold) return false;

  const nonAllFilters = (config.filters ?? []).filter(
    (filter) => filter.visible !== false && filter.matchKind !== "all"
  );
  if (nonAllFilters.length === 0) return false;

  const categoriesWithMatches = nonAllFilters.filter((filter) =>
    programs.some((program) => buildProgramsShowcaseMatcher(filter)(program))
  );

  return categoriesWithMatches.length >= 2;
}

export function resolveShowcasePrograms(
  programs: ProgramItem[],
  config: Pick<
    ProgramsShowcaseConfig,
    "featuredProgramId" | "secondaryProgramIds" | "maxSecondaryVisible"
  >
): {
  featured: ProgramItem | null;
  secondary: ProgramItem[];
} {
  if (programs.length === 0) {
    return { featured: null, secondary: [] };
  }

  const maxSecondary = config.maxSecondaryVisible ?? 3;
  const featured =
    programs.find((program) => program.id === config.featuredProgramId) ?? programs[0];

  const pickedSecondaryIds = config.secondaryProgramIds?.length
    ? config.secondaryProgramIds
    : programs
        .filter((program) => program.id !== featured.id)
        .slice(0, maxSecondary)
        .map((program) => program.id);

  const secondary = pickedSecondaryIds
    .map((id) => programs.find((program) => program.id === id))
    .filter((program): program is ProgramItem => Boolean(program))
    .filter((program) => program.id !== featured.id)
    .slice(0, maxSecondary);

  return { featured, secondary };
}

export const DEFAULT_PROGRAMS_SHOWCASE_FILTERS: ProgramsShowcaseFilter[] = [
  { id: "all", label: "Todos", matchKind: "all", visible: true, order: 0 },
  {
    id: "diplomas",
    label: "Diplomas",
    matchKind: "text",
    matchValue: "diplom",
    visible: true,
    order: 1,
  },
  {
    id: "certificados",
    label: "Certificados",
    matchKind: "text",
    matchValue: "certificado",
    visible: true,
    order: 2,
  },
  {
    id: "cursos",
    label: "Cursos",
    matchKind: "text",
    matchValue: "curso",
    visible: true,
    order: 3,
  },
  {
    id: "especializaciones",
    label: "Especializaciones",
    matchKind: "text",
    matchValue: "especializaci",
    visible: true,
    order: 4,
  },
];
