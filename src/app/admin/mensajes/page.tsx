import { MensajesInboxClient } from "@/components/admin/growth/MensajesInboxClient";
import { can } from "@/core/identity/policies/engine";
import {
  getGrowthMensajesThread,
  listGrowthMensajesInbox,
} from "@/lib/growth/mensajes-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    c?: string;
  }>;
}

export default async function AdminMensajesPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/mensajes");
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
  const selectedId = params.c?.trim() ?? "";

  const items = await listGrowthMensajesInbox(tenantId, {
    q: q || undefined,
  });

  const thread =
    selectedId.length > 0
      ? await getGrowthMensajesThread(tenantId, selectedId)
      : null;

  return (
    <MensajesInboxClient
      items={items}
      selectedId={thread?.id ?? ""}
      thread={thread}
      q={q}
      canReply={can(authCtx, "growth.sales.operate")}
    />
  );
}
