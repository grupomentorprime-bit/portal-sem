import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm, loginErrorMessage } from "@/components/identity/LoginForm";
import { ProductAuthFrame } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";
import { loadSessionContext } from "@/lib/identity/sessions";

export const dynamic = "force-dynamic";

/** Superficie de plataforma: no hereda SEO/CMS del Espacio resuelto por Host. */
export const metadata: Metadata = {
  title: `Ingresar | ${PLATFORM_DISPLAY_NAME}`,
  description: `Acceso a ${PLATFORM_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
};

function safeNext(value: string | undefined): string | null {
  const next = value?.trim() ?? "";
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await loadSessionContext();
  if (session) redirect("/admin");

  const params = await searchParams;
  const next = safeNext(params.next);
  const loginHref = next
    ? `/api/identity/auth/keycloak/login?next=${encodeURIComponent(next)}`
    : "/api/identity/auth/keycloak/login";

  return (
    <ProductAuthFrame
      title="Ingresar"
      description={<p>Entra a tu Espacio en {PLATFORM_DISPLAY_NAME}.</p>}
    >
      <LoginForm
        loginHref={loginHref}
        authReady={isKeycloakEnabled()}
        errorMessage={loginErrorMessage(params.error)}
      />
    </ProductAuthFrame>
  );
}
