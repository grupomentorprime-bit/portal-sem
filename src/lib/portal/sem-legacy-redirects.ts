/**
 * Rutas públicas anteriores del SEM. Solo T001 las redirige.
 * ADL conserva sus propias páginas.
 */
export const SEM_CANONICAL_REDIRECTS = {
  "/institucion": "/el-sem",
  "/como-se-estudia": "/como-estudiamos",
  "/malla": "/formacion/malla",
} as const;

export type SemLegacyPath = keyof typeof SEM_CANONICAL_REDIRECTS;

export function semCanonicalRedirect(slug: string): string | null {
  const path = slug.startsWith("/") ? slug : `/${slug}`;
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (normalized in SEM_CANONICAL_REDIRECTS) {
    return SEM_CANONICAL_REDIRECTS[normalized as SemLegacyPath];
  }
  return null;
}
