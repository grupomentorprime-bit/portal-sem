import { VentasListClient } from "@/components/admin/growth/VentasListClient";
import { can } from "@/core/identity/policies/engine";
import { readGrowthVentasBoard } from "@/lib/growth/ventas-read";
import { listGrowthSpaceMembers } from "@/lib/growth/space-members";
import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    nextAction?: string;
    funnel?: string;
    vista?: string;
    banda?: string;
  }>;
}

export default async function AdminVentasPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/login?next=/admin/ventas");
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

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const type = params.type?.trim() ?? "";
  const nextAction = params.nextAction?.trim() ?? "";
  const funnel = params.funnel?.trim() ?? "";
  const band = params.banda?.trim() ?? "";
  const vista = params.vista === "lista" ? "lista" : "kanban";
  ensureCumpleGrowthAssessmentPort();

  const board = await readGrowthVentasBoard(tenantId, {
    q: q || undefined,
    status: status || undefined,
    type: type || undefined,
    funnel: funnel || undefined,
    nextAction: nextAction || undefined,
    band: band || undefined,
  });
  const members = await listGrowthSpaceMembers(tenantId);

  return (
    <VentasListClient
      items={board.items}
      funnels={board.funnels}
      lanes={board.lanes}
      statusOptions={board.statusOptions}
      q={q}
      status={status}
      type={type}
      funnel={funnel}
      nextAction={nextAction}
      band={band}
      vista={vista}
      canOperate={can(authCtx, "growth.sales.operate")}
      canManageFunnels={can(authCtx, "growth.funnels.manage")}
      members={members}
    />
  );
}
