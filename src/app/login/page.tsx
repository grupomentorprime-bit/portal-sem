import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/identity/LoginForm";
import { loginErrorMessage } from "@/components/identity/login-errors";
import { ProductAuthFrame } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { resolvePostAuthDestination } from "@/core/identity/platform/landing";
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
  if (next === "/login" || next === "/admin/login" || next === "/ingresar") return null;
  return next;
}

export default async function GrowthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const session = await loadSessionContext();
  if (session) {
    redirect(
      resolvePostAuthDestination({
        hasSpace: Boolean(session.membership && session.session.tenantId?.trim()),
        isPlatformOperator: hasPlatformOperatorCapability(session.user),
        next,
      })
    );
  }
  return (
    <ProductAuthFrame
      title="Ingresar"
      description={<p>Entra a tu Espacio en {PLATFORM_DISPLAY_NAME}.</p>}
    >
      <LoginForm
        next={next}
        authReady={isKeycloakEnabled()}
        errorMessage={loginErrorMessage(params.error)}
      />
    </ProductAuthFrame>
  );
}
