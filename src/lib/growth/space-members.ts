/**
 * Miembros activos del Espacio. Un responsable solo puede ser uno de ellos.
 */

import "server-only";

import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";

export interface GrowthSpaceMemberOption {
  userId: string;
  label: string;
}

export async function listGrowthSpaceMembers(
  tenantId: string
): Promise<GrowthSpaceMemberOption[]> {
  const memberships = (await listMembershipsByTenant(tenantId)).filter(
    (membership) => membership.tenantId === tenantId && membership.status === "active"
  );
  const users = await listUsersByIds(memberships.map((membership) => membership.userId));
  const byId = new Map(users.map((user) => [user._id, user]));
  return memberships
    .map((membership) => {
      const user = byId.get(membership.userId);
      return {
        userId: membership.userId,
        label: user?.displayName?.trim() || user?.email || membership.userId,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}
