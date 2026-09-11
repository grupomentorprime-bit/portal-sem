import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/identity/LogoutButton";
import { ProductAuthFrame } from "@/components/product";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Estado S4 — sin Espacio.
 * Cuenta autenticada sin membresías activas: nunca cascarón vacío.
 */
export default async function SinEspacioPage() {
  const session = await loadSessionContext();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.membership && session.session.tenantId?.trim()) {
    redirect("/admin");
  }

  return (
    <ProductAuthFrame
      title="Sin Espacio"
      description={
        <p>
          Tu Cuenta ({session.user.email}) no tiene un Espacio de trabajo activo.
          Solicita una invitación al administrador del Espacio al que necesitas
          acceder.
        </p>
      }
      actions={
        <>
          <Button href="/" variant="outline">
            Ir al Sitio público
          </Button>
          <LogoutButton />
        </>
      }
    />
  );
}
