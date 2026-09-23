/**
 * Rutas que el catch-all de páginas CMS no puede ocupar.
 * Los handlers de plataforma y de producto siguen siendo los dueños de esas URLs.
 */

const RESERVED_PREFIXES = [
  "/admin",
  "/api",
  "/ingresar",
  "/invite",
  "/platform",
  "/internal",
  "/legal",
  "/dev-preview",
  "/auth",
  "/login",
  "/logout",
  "/programas",
  "/formularios",
  "/postulacion",
  "/asistencia",
  "/agenda-academica",
  "/avisos",
  "/noticias",
  "/eventos",
  "/biblioteca",
  "/equipo",
] as const;

/** La landing de campaña no es una página CMS genérica. */
const CAMPAIGN_ADMISSION_PATH = "/admision/2027";

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function publicPathname(href: string | undefined): string {
  const raw = (href ?? "").split(/[?#]/)[0] ?? "";
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function isReservedPublicPath(pathname: string): boolean {
  const path = publicPathname(pathname);
  if (path === CAMPAIGN_ADMISSION_PATH) return true;
  return RESERVED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isDisallowedCmsSlug(slug: string): boolean {
  return isReservedPublicPath(slug);
}

export type PublicCmsSegmentParse =
  | { ok: true; slug: string }
  | { ok: false; reason: "reserved" | "invalid" };

export function parsePublicCmsSegments(segments: string[]): PublicCmsSegmentParse {
  if (segments.length === 0 || segments.length > 6) {
    return { ok: false, reason: "invalid" };
  }
  if (segments.some((segment) => !SEGMENT.test(segment))) {
    return { ok: false, reason: "invalid" };
  }
  const slug = `/${segments.join("/")}`;
  if (isReservedPublicPath(slug)) {
    return { ok: false, reason: "reserved" };
  }
  return { ok: true, slug };
}
