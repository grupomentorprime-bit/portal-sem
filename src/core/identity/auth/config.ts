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
