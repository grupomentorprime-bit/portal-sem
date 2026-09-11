import { VentasOperateClient } from "@/components/admin/growth/VentasOperateClient";
import { EmptyState } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { can } from "@/core/identity/policies/engine";
import {
  GROWTH_VENTAS_PAGE_TITLE,
} from "@/lib/growth/labels";
import { getGrowthVentasOperateView } from "@/lib/growth/ventas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { CircleOff } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminVentasOportunidadPage({
  params,
}: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/ventas");
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
  if (
    !can(authCtx, "growth.sales.read") &&
    !can(authCtx, "growth.sales.operate")
  ) {
    redirect("/admin");
  }

  const { id } = await params;
  const item = await getGrowthVentasOperateView(tenantId, id);

  if (!item) {
    return (
      <AdminModulePage
        breadcrumbs={[
          { label: "Inicio", href: "/admin" },
          { label: GROWTH_VENTAS_PAGE_TITLE, href: "/admin/ventas" },
          { label: "No encontrada" },
        ]}
        title="Oportunidad"
      >
        <EmptyState
          title="No encontramos esta Oportunidad"
          description="Puede que no exista en este Espacio o que el enlace sea incorrecto."
          icon={<CircleOff className="h-8 w-8" />}
          action={{ label: "Volver a Ventas", href: "/admin/ventas" }}
        />
        <div className="mt-4">
          <Button href="/admin/ventas" variant="outline" size="sm">
            Ventas
          </Button>
        </div>
      </AdminModulePage>
    );
  }

  return (
    <VentasOperateClient
      item={item}
      canOperate={can(authCtx, "growth.sales.operate")}
    />
  );
}
