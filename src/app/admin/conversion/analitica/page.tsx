/**
 * Conversion Engine fase 3 — /admin/conversion/analitica.
 * Lectura por Espacio; permiso growth.sales.view.
 */

import { ConversionAnaliticaClient } from "@/components/admin/growth/ConversionAnaliticaClient";
import { can } from "@/core/identity/policies/engine";
import type { AnalyticsPeriodPreset } from "@/lib/growth/analytics-period";
import { getConversionAnalytics } from "@/lib/growth/conversion-analytics-read";
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

export default async function AdminConversionAnaliticaPage({
  searchParams,
}: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/login?next=/admin/conversion/analitica");
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

  if (!can(authCtx, "growth.sales.view")) {
    redirect("/admin");
  }

  const params = await searchParams;
  const presetRaw = params.preset?.trim() || "last_30d";
  let result: Awaited<ReturnType<typeof getConversionAnalytics>> | null = null;
  try {
    result = await getConversionAnalytics(tenantId, {
      preset: presetRaw,
      from: params.from,
      to: params.to,
    });
  } catch (error) {
    // Sin datos iniciales: el cliente reintenta y muestra AlertBanner, nunca ceros.
    console.error(error);
  }

  const initialPreset = (
    result?.ok ? result.data.period.preset : "last_30d"
  ) as AnalyticsPeriodPreset;

  return (
    <ConversionAnaliticaClient
      initial={result?.ok ? result.data : null}
      initialPreset={initialPreset}
    />
  );
}
