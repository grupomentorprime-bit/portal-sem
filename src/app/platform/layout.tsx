import type { Metadata } from "next";
import { loadSessionContext } from "@/lib/identity/sessions";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { readPlatformRoles } from "@/core/identity/platform/capability";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/identity/LogoutButton";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { ProductAuthFrame } from "@/components/product";
import { Button } from "@/components/ui/button";
import { labelPlatformRole } from "@/lib/platform/space-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Administración | ${PLATFORM_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
};

function PlatformForbidden() {
  return (
    <ProductAuthFrame
      title="Acceso denegado"
      description={
        <p>
          Esta superficie es para operadores de {PLATFORM_DISPLAY_NAME}.
          Administrar un Espacio no otorga acceso global.
        </p>
      }
      actions={
        <>
          <Button href="/admin" variant="outline">
            Ir al Espacio
          </Button>
          <LogoutButton />
        </>
      }
    />
  );
}

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await loadSessionContext();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(PLATFORM_ADMIN_HOME)}`);
  }

  if (!hasPlatformOperatorCapability(session.user)) {
    return <PlatformForbidden />;
  }

  const roles = readPlatformRoles(session.user);
  const userName =
    session.user.displayName?.trim() || session.user.email || "Operador";
  const roleLabel = labelPlatformRole(roles);

  return (
    <PlatformShell userName={userName} roleLabel={roleLabel}>
      {children}
    </PlatformShell>
  );
}
