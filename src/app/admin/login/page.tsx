import { Suspense } from "react";
import { LoginForm } from "@/components/identity/LoginForm";
import { ProductAuthFrame } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const institutionalOnly = isKeycloakOnlyAuth();
  const authReady = isKeycloakEnabled();

  return (
    <ProductAuthFrame
      title="Acceso"
      description={
        <>
          <p>
            {institutionalOnly
              ? "Ingresa con tu correo y contraseña de Cuenta."
              : `Ingresa a tu Espacio en ${PLATFORM_DISPLAY_NAME}.`}
          </p>
          {institutionalOnly && !authReady ? (
            <p className="mt-2 text-xs text-[var(--color-danger)]">
              El servicio de autenticación no está disponible. Contacta al
              administrador del Espacio.
            </p>
          ) : null}
        </>
      }
      className="text-left sm:text-center"
    >
      <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </ProductAuthFrame>
  );
}
