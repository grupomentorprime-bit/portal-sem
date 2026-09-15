import { PersonasListClient } from "@/components/admin/growth/PersonasListClient";
import { can } from "@/core/identity/policies/engine";
import { listGrowthPersonaViews } from "@/lib/growth/personas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    origin?: string;
  }>;
}

function canViewPeople(authCtx: Parameters<typeof can>[0]): boolean {
  return (
    can(authCtx, "growth.people.view") || can(authCtx, "growth.people.manage")
  );
}

export default async function AdminPersonasPage({ searchParams }: PageProps) {
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

  const canManage = can(authCtx, "growth.people.manage");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const opportunityType = params.type?.trim() ?? "";
  const opportunityStatus = params.status?.trim() ?? "";
  const origin = params.origin?.trim() ?? "";

  const items = await listGrowthPersonaViews(tenantId, {
    q: q || undefined,
    opportunityType: opportunityType || undefined,
    opportunityStatus: opportunityStatus || undefined,
    origin: origin || undefined,
  });

  return (
    <PersonasListClient
      items={items}
      q={q}
      opportunityType={opportunityType}
      opportunityStatus={opportunityStatus}
      origin={origin}
      canManage={canManage}
      listLimit={100}
    />
  );
}
