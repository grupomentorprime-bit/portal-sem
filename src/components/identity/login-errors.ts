const OAUTH_ERRORS: Record<string, string> = {
  keycloak: "No se pudo completar el inicio de sesión. Intenta de nuevo.",
  oauth_state: "La sesión de autenticación expiró o no es válida. Intenta de nuevo.",
  oauth_pkce: "No se pudo validar el inicio de sesión. Intenta de nuevo.",
  email: "No se pudo validar el correo de tu Cuenta.",
  no_access:
    "Tu Cuenta no tiene acceso a un Espacio. Solicita una invitación al administrador.",
  tenant: "El Espacio no está configurado.",
};

export function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return OAUTH_ERRORS[code] ?? "No se pudo completar el inicio de sesión. Intenta de nuevo.";
}
