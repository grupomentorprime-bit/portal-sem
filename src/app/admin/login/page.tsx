import { Suspense } from "react";
import { LoginForm } from "@/components/identity/LoginForm";
import { isIdentityEnforced, isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const institutionalOnly = isKeycloakOnlyAuth();
  const authReady = isKeycloakEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Centro de Administración</h1>
          <p className="mt-1 text-sm text-muted">
            {institutionalOnly
              ? "Ingresa con tu correo y contraseña institucional."
              : "Acceso institucional al CMS del SEM"}
          </p>
          {institutionalOnly && !authReady ? (
            <p className="mt-2 text-xs text-[var(--color-danger)]">
              El servicio de autenticación no está disponible. Contacta al administrador del sistema.
            </p>
          ) : null}
          {!isIdentityEnforced() ? (
            <p className="mt-2 text-xs text-[var(--color-warning)]">
              El acceso sin autenticación está habilitado en este entorno.
            </p>
          ) : null}
        </div>
        <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
