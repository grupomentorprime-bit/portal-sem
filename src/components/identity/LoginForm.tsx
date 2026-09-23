import Link from "next/link";

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

/**
 * Entrada única: navegación completa a Auth Code + PKCE.
 * No envía correo ni contraseña.
 */
export function LoginForm({
  loginHref,
  errorMessage,
  authReady,
}: {
  loginHref: string;
  errorMessage?: string | null;
  authReady: boolean;
}) {
  if (!authReady) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          El servicio de autenticación no está disponible. Contacta al administrador del Espacio.
        </p>
        <p className="text-center text-xs text-muted">
          <Link
            href="/"
            className="font-medium text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
          >
            Volver a Growth OS
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <p className="text-sm text-[var(--color-danger)]">{errorMessage}</p> : null}

      <a
        href={loginHref}
        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-secondary"
      >
        Ingresar a Growth OS
      </a>

      <p className="pt-1 text-center text-xs text-muted">
        <Link
          href="/"
          className="font-medium text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
        >
          Volver a Growth OS
        </Link>
      </p>
    </div>
  );
}
