import { PersonaDetailClient } from "@/components/admin/growth/PersonaDetailClient";
import { EmptyState } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { can } from "@/core/identity/policies/engine";
import { getGrowthPersonaDetailView } from "@/lib/growth/personas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { UserRoundX } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oportunidad?: string }>;
}

function canViewPeople(authCtx: Parameters<typeof can>[0]): boolean {
  return (
    can(authCtx, "growth.people.view") || can(authCtx, "growth.people.manage")
  );
}

function canOpenSales(authCtx: Parameters<typeof can>[0]): boolean {
  return (
    can(authCtx, "growth.sales.view") ||
    can(authCtx, "growth.sales.read") ||
    can(authCtx, "growth.sales.operate")
  );
}

function canOpenMessages(authCtx: Parameters<typeof can>[0]): boolean {
  return canOpenSales(authCtx);
}

function canOpenActivity(authCtx: Parameters<typeof can>[0]): boolean {
  return (
    can(authCtx, "growth.sales.read") || can(authCtx, "growth.sales.operate")
  );
}

export default async function AdminPersonaDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/personas");
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const { readPlatformRoles } = await import(
    "@/core/identity/platform/capability"
  );
  const permissions = await resolvePermissionsForMembership(
    tenantId,
    session.membership
  );
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };

  if (!canViewPeople(authCtx)) {
    redirect("/admin");
  }

  const { id } = await params;
  const { oportunidad } = await searchParams;
  const persona = await getGrowthPersonaDetailView(tenantId, id);

  if (!persona) {
    // Persona inexistente y Persona de otro Espacio: misma respuesta.
    return (
      <AdminModulePage
        breadcrumbs={[
          { label: "Inicio", href: "/admin" },
          { label: "Personas", href: "/admin/personas" },
          { label: "No encontrada" },
        ]}
        title="Persona no encontrada"
      >
        <EmptyState
          title="No encontramos esta Persona"
          description="Puede que no exista en este Espacio o que el enlace sea incorrecto."
          icon={<UserRoundX className="h-8 w-8" />}
          action={{ label: "Volver a Personas", href: "/admin/personas" }}
        />
        <div className="mt-4">
          <Button href="/admin/personas" variant="outline" size="sm">
            Personas
          </Button>
        </div>
      </AdminModulePage>
    );
  }

  return (
    <PersonaDetailClient
      persona={persona}
      focusOportunidadId={oportunidad?.trim() || undefined}
      canOpenSales={canOpenSales(authCtx)}
      canOpenMessages={canOpenMessages(authCtx)}
      canOpenActivity={canOpenActivity(authCtx)}
    />
  );
}
