/** Cookies temporales del flujo Authorization Code + PKCE (httpOnly, un solo uso). */
export const STATE_COOKIE = "kc_oauth_state";
export const NEXT_COOKIE = "kc_oauth_next";
export const PKCE_COOKIE = "kc_oauth_pkce";

/** Lee una cookie del header Cookie de la petición (fuente del navegador). */
export function readRequestCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    const value = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}
