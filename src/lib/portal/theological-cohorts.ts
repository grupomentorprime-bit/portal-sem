import { isCourseOffering } from "@/lib/admin/catalog-kind";

/** Cohortes ya publicadas. G-2027 no se inventa: entra cuando exista la ficha. */
export const THEOLOGICAL_COHORT_YEARS = [2023, 2024, 2025, 2026] as const;
export type TheologicalCohortYear = (typeof THEOLOGICAL_COHORT_YEARS)[number];

export interface FormationCatalogItem {
  id: string;
  title: string;
  href: string;
  category?: string;
  categories?: string[];
  certification?: string;
  badge?: string;
}

function cohortYearFromText(value: string): TheologicalCohortYear | null {
  const coded = value.match(/G[-\s]?(2023|2024|2025|2026)(?!\d)/i);
  const named = value.match(/(?:generaci[oó]n|cohorte)[^\d]{0,16}(2023|2024|2025|2026)(?!\d)/i);
  const year = Number((coded ?? named)?.[1]);
  if (year === 2023 || year === 2024 || year === 2025 || year === 2026) return year;
  return null;
}

/** Año de cohorte de Educación Teológica. No altera el documento del programa. */
export function theologicalCohortYear(item: FormationCatalogItem): TheologicalCohortYear | null {
  if (isCourseOffering(item)) return null;
  const blob = [item.title, item.href, item.badge, item.id, item.category].filter(Boolean).join(" ");
  return cohortYearFromText(blob);
}

export function groupTheologicalCohorts<T extends FormationCatalogItem>(items: readonly T[]): T[] {
  return items
    .map((item) => ({ item, year: theologicalCohortYear(item) }))
    .filter((entry): entry is { item: T; year: TheologicalCohortYear } => entry.year !== null)
    .sort((a, b) => a.year - b.year || a.item.title.localeCompare(b.item.title, "es"))
    .map((entry) => entry.item);
}

export function listFormationCourses<T extends FormationCatalogItem>(items: readonly T[]): T[] {
  return items.filter((item) => isCourseOffering(item));
}

export interface TheologicalCohortLink {
  year: TheologicalCohortYear;
  label: string;
  href?: string;
}

function programFichaHref(href: string | undefined): string | undefined {
  const path = href?.split(/[?#]/)[0]?.replace(/\/$/, "") ?? "";
  if (!path.startsWith("/programas/") || path === "/programas") return undefined;
  return path;
}

/** Una ficha por año. La etiqueta es la cohorte, no el título del documento. */
export function listTheologicalCohortLinks(
  items: readonly FormationCatalogItem[]
): TheologicalCohortLink[] {
  const hrefByYear = new Map<TheologicalCohortYear, string>();
  for (const item of groupTheologicalCohorts(items)) {
    const year = theologicalCohortYear(item);
    const href = programFichaHref(item.href);
    if (!year || !href || hrefByYear.has(year)) continue;
    hrefByYear.set(year, href);
  }
  return THEOLOGICAL_COHORT_YEARS.map((year) => ({
    year,
    label: `G-${year}`,
    href: hrefByYear.get(year),
  }));
}
