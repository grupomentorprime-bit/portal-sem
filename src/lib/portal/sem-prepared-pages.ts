/**
 * Páginas del árbol SEM que deben responder aunque el CMS aún no tenga bloques.
 * El documento publicado, si existe, sigue siendo la fuente.
 */

export type SemPreparedKind = "shell" | "people" | "cohorts" | "courses";

export interface SemPreparedPage {
  slug: string;
  title: string;
  kind: SemPreparedKind;
  teamGroupId?: string;
  pending: string;
}

export const SEM_PREPARED_PAGES: SemPreparedPage[] = [
  {
    slug: "/el-sem",
    title: "El SEM",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/el-sem/quienes-somos",
    title: "Quiénes somos",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/el-sem/historia",
    title: "Historia",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/el-sem/mision-vision-proposito",
    title: "Misión, visión y propósito",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/el-sem/directivos",
    title: "Nuestros directivos",
    kind: "people",
    teamGroupId: "team_directivos",
    pending: "El directorio se publicará cuando las personas estén asignadas a Directivos.",
  },
  {
    slug: "/el-sem/equipo-academico",
    title: "Equipo académico",
    kind: "people",
    teamGroupId: "team_academic",
    pending: "El directorio se publicará cuando las personas estén asignadas a Equipo académico.",
  },
  {
    slug: "/el-sem/ipn-chile",
    title: "IPN Chile",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/formacion",
    title: "Formación",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/formacion/educacion-teologica",
    title: "Educación Teológica",
    kind: "cohorts",
    pending: "La introducción de esta línea se publicará cuando esté lista.",
  },
  {
    slug: "/formacion/cursos",
    title: "Cursos de Formación",
    kind: "courses",
    pending: "La introducción de esta línea se publicará cuando esté lista.",
  },
  {
    slug: "/formacion/malla",
    title: "Malla / Plan de estudios",
    kind: "shell",
    pending: "El detalle de asignaturas se publicará cuando exista una estructura académica validada.",
  },
  {
    slug: "/como-estudiamos",
    title: "Cómo estudiamos",
    kind: "shell",
    pending: "El contenido de esta página se publicará cuando esté listo.",
  },
  {
    slug: "/admision",
    title: "Admisión",
    kind: "shell",
    pending: "El proceso general de admisión se publicará cuando esté listo.",
  },
];

const BY_SLUG = new Map(SEM_PREPARED_PAGES.map((page) => [page.slug, page]));

export function getSemPreparedPage(slug: string): SemPreparedPage | undefined {
  return BY_SLUG.get(slug);
}

export function semPreparedChildren(slug: string): SemPreparedPage[] {
  const prefix = `${slug}/`;
  return SEM_PREPARED_PAGES.filter((page) => page.slug.startsWith(prefix) && !page.slug.slice(prefix.length).includes("/"));
}
