/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 + OT-GROWTH-UX-ANALYTICS-004 —
 * /admin/analitica (read model + diseño visual final).
 */

import { AnaliticaClient } from "@/components/admin/growth/AnaliticaClient";
import { can } from "@/core/identity/policies/engine";
import {
  getAnalyticsV1,
  type AnalyticsPeriodPreset,
} from "@/lib/growth/analytics-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminAnaliticaPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/analitica");
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

  if (!can(authCtx, "growth.analytics.view")) {
    redirect("/admin");
  }

  const params = await searchParams;
  const presetRaw = params.preset?.trim() || "last_30d";
  const result = await getAnalyticsV1(tenantId, {
    preset: presetRaw,
    from: params.from,
    to: params.to,
  });

  const initialPreset = (
    result.ok ? result.data.period.preset : "last_30d"
  ) as AnalyticsPeriodPreset;

  return (
    <AnaliticaClient
      initial={result.ok ? result.data : null}
      initialPreset={initialPreset}
    />
  );
}
