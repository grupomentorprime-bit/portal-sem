export const SESSION_COOKIE = "ah_session";
export const SESSION_TTL_DAYS = 30;

export function isIdentityEnforced(): boolean {
  return process.env.IDENTITY_ENFORCE === "true";
}

/** Solo Keycloak; deshabilita login/registro por email y contraseña. */
export function isKeycloakOnlyAuth(): boolean {
  return process.env.AUTH_BACKEND?.trim().toLowerCase() === "keycloak";
}

export function isEmailAuthEnabled(): boolean {
  return !isKeycloakOnlyAuth();
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET es obligatorio en producción.");
  }
  return secret ?? "dev-session-secret-change-me";
}

export function sessionExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d.toISOString();
}

function readSecureCookieOverride(): boolean | null {
  const override = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;
  return null;
}

function secureCookieFromAppUrl(): boolean | null {
  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (appUrl.startsWith("https://")) return true;
  if (appUrl.startsWith("http://")) return false;
  return null;
}

function secureCookieFromProto(proto: string | null): boolean | null {
  if (!proto) return null;
  const normalized = proto.split(",")[0]?.trim().toLowerCase();
  if (normalized === "https") return true;
  if (normalized === "http") return false;
  return null;
}

function readForwardedProto(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-proto") ??
    headers.get("x-forwarded-protocol") ??
    headers.get("cloudfront-forwarded-proto")
  );
}

/** Cookies Secure según el protocolo real de la petición o APP_URL. */
export function isSecureCookieFromHeaders(headers: Headers): boolean {
  const override = readSecureCookieOverride();
  if (override !== null) return override;

  const fromProto = secureCookieFromProto(readForwardedProto(headers));
  if (fromProto !== null) return fromProto;

  const fromAppUrl = secureCookieFromAppUrl();
  if (fromAppUrl !== null) return fromAppUrl;

  return process.env.NODE_ENV === "production";
}

/** @deprecated Usa `resolveSecureCookie()` en handlers para respetar x-forwarded-proto. */
export function isSecureCookie(): boolean {
  const override = readSecureCookieOverride();
  if (override !== null) return override;

  const fromAppUrl = secureCookieFromAppUrl();
  if (fromAppUrl !== null) return fromAppUrl;

  return process.env.NODE_ENV === "production";
}
