/** Ruta oficial de acceso a Growth OS (Auth Code + PKCE). */
export const GROWTH_LOGIN_PATH = "/login";

const LEGACY_LOGIN_PATHS = new Set(["/login", "/admin/login", "/ingresar"]);

function safeNext(value: string | null | undefined): string | null {
  const next = value?.trim() ?? "";
  const pathOnly = next.split("?")[0] ?? "";
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (LEGACY_LOGIN_PATHS.has(pathOnly)) return null;
  return next;
}

/** Arma `/login` conservando `next` y `error` de las rutas de compatibilidad. */
export function toGrowthLoginPath(params: {
  next?: string | null;
  error?: string | null;
} = {}): string {
  const qs = new URLSearchParams();
  const next = safeNext(params.next);
  if (next) qs.set("next", next);
  const error = params.error?.trim() ?? "";
  if (error) qs.set("error", error);
  const query = qs.toString();
  return query ? `${GROWTH_LOGIN_PATH}?${query}` : GROWTH_LOGIN_PATH;
}
