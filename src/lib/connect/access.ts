import "server-only";

import { findTenantById } from "@/core/tenant";
import { CUMPLE_SPACE_ID } from "@/lib/desktop/catalog";
import { allowedCumpleBase, aprendeHoyOriginFromEnv, rrhhOriginFromEnv } from "@/lib/connect/desk";
import type { ConnectAccessInput } from "@/lib/connect/policy";
import { findMembership } from "@/lib/identity/memberships";
import { getDatabase } from "@/lib/mongodb";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";

/** Lee plan y origen tal como están guardados. No aplica el default del escritorio. */
export async function readConnectAccess(input: {
  userId: string;
  tenantId: string;
  appId: string;
}): Promise<ConnectAccessInput> {
  const tenantId = input.tenantId.trim();
  let contractedApps: ConnectAccessInput["contractedApps"] = null;
  let resolvedOrigin: string | null = null;

  const [tenant, membership] = tenantId
    ? await Promise.all([
        findTenantById(await getDatabase(), tenantId),
        findMembership(input.userId, tenantId),
      ])
    : [null, null];
  if (tenantId) {
    contractedApps = Array.isArray(tenant?.contractedApps) ? tenant.contractedApps : null;
    if (input.appId === "rrhh") {
      resolvedOrigin = rrhhOriginFromEnv();
    } else if (input.appId === "aprende-hoy") {
      resolvedOrigin = aprendeHoyOriginFromEnv();
    } else if (tenantId === CUMPLE_SPACE_ID) {
      resolvedOrigin = await resolvePublicOriginForTenant(tenantId).catch(() => null);
    }
  }
  return {
    appId: input.appId,
    tenantId,
    membershipActive: Boolean(membership),
    contractedApps,
    authorizedApps: membership ? (membership.authorizedApps ?? null) : null,
    resolvedOrigin,
    spaceBaseDomain: allowedCumpleBase(),
  };
}
