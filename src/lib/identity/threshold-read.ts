import "server-only";

import { usesStudentAffairsFocusedShell } from "@/lib/admin/nav-access";
import { readCommercialPanel } from "@/lib/growth/commercial-read";
import { findMembership } from "@/lib/identity/memberships";
import { resolvePermissionsForMembership } from "@/lib/identity/permission-resolver";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import {
  crossingMayResolveAccess,
  crossingNeedsPanel,
  crossingThresholdLine,
  redirectPath,
  type ThresholdAttentionRow,
} from "@/lib/identity/threshold-line";

export async function readCrossingThresholdLine(input: {
  userId: string;
  tenantId: string | null;
  redirectTo: string;
}): Promise<{ line: string; announceArrival: boolean }> {
  const path = redirectPath(input.redirectTo);
  const tenantId = input.tenantId?.trim() ?? "";
  const hasTenant = tenantId.length > 0;
  if (!crossingMayResolveAccess(path, hasTenant)) {
    return crossingThresholdLine({
      redirectTo: input.redirectTo,
      hasTenant,
      studentAffairs: false,
      canSales: false,
    });
  }

  const membership = await findMembership(input.userId, tenantId);
  const roles = membership
    ? await findRolesByIds(tenantId, membership.roleIds)
    : [];
  const roleCodes = roles
    .map((role) => getRoleCode(role))
    .filter((code): code is NonNullable<typeof code> => Boolean(code));
  const permissions = membership
    ? await resolvePermissionsForMembership(tenantId, membership)
    : [];
  const studentAffairs = usesStudentAffairsFocusedShell(permissions, false, roleCodes);
  const salesView = permissions.includes("growth.sales.view");
  const salesRead = permissions.includes("growth.sales.read");
  const salesOperate = permissions.includes("growth.sales.operate");
  const canSales = salesView || salesRead || salesOperate;
  const flags = { hasTenant: true, studentAffairs, canSales };
  if (!crossingNeedsPanel(path, flags)) {
    return crossingThresholdLine({
      redirectTo: input.redirectTo,
      hasTenant: true,
      studentAffairs,
      canSales,
    });
  }

  const spaceWide = salesView || salesRead;
  const panel = await readCommercialPanel(tenantId, input.userId, spaceWide);
  const attentionRows: ThresholdAttentionRow[] = panel.rows.map((row) => ({
    personaLabel: row.personaLabel,
    band: row.band,
    bandLabel: row.bandLabel,
  }));
  return crossingThresholdLine({
    redirectTo: input.redirectTo,
    hasTenant: true,
    studentAffairs,
    canSales,
    attentionRows,
  });
}
