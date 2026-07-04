import type { ContentDocument } from "@/types/content";

export type AcademicCatalogKind = "programs" | "courses";

function programCatalogText(
  program: Pick<ContentDocument, "title" | "category" | "certification" | "categories">
): string {
  return [program.title, program.category, program.certification, ...(program.categories ?? [])]
    .filter(Boolean)
    .join(" ");
}

/** Cursos cortos — misma heurística que el catálogo público (`matchValue: "curso"`). */
export function isCourseOffering(program: ContentDocument): boolean {
  return /curso/i.test(programCatalogText(program));
}

export function matchesAcademicCatalogKind(
  program: ContentDocument,
  kind: AcademicCatalogKind
): boolean {
  return kind === "courses" ? isCourseOffering(program) : !isCourseOffering(program);
}

export function filterByAcademicCatalogKind(
  programs: ContentDocument[],
  kind: AcademicCatalogKind
): ContentDocument[] {
  return programs.filter((program) => matchesAcademicCatalogKind(program, kind));
}
