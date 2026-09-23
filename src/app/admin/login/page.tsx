import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/identity/LoginForm";
import { ProductAuthFrame } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";

export const dynamic = "force-dynamic";

/** Superficie de plataforma: no hereda SEO/CMS del Espacio resuelto por Host. */
export const metadata: Metadata = {
  title: `Ingresar | ${PLATFORM_DISPLAY_NAME}`,
  description: `Acceso a ${PLATFORM_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const institutionalOnly = isKeycloakOnlyAuth();
  const authReady = isKeycloakEnabled();

  return (
    <ProductAuthFrame
      title="Ingresar"
      description={
        <>
          <p>
            {institutionalOnly
              ? "Usa tu correo y contraseña para entrar a tu Espacio en Growth OS."
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
    >
      <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </ProductAuthFrame>
  );
}
