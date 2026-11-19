import "server-only";

import { isSpaceAdministratorRole } from "@/core/identity/policies/last-admin";
import type { IdentityRole } from "@/types/identity";
import { getTargetRoleCode } from "@/lib/identity/iam-guard";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { findRolesByIds } from "@/lib/identity/roles";
import { listUsersByIds } from "@/lib/identity/users";

export interface CompanyPerson {
  userId: string;
  name: string;
  email: string;
  admin: boolean;
}

export async function listCompanyPeople(tenantId: string): Promise<CompanyPerson[]> {
  const memberships = (await listMembershipsByTenant(tenantId)).filter((item) => item.status === "active");
  if (memberships.length === 0) return [];
  const roleIds = [...new Set(memberships.flatMap((item) => item.roleIds))];
  const roles = await findRolesByIds(tenantId, roleIds);
  const roleMap = new Map(roles.map((role) => [role._id, role]));
  const users = await listUsersByIds(memberships.map((item) => item.userId));
  const userMap = new Map(users.map((user) => [user._id, user]));
  const people: CompanyPerson[] = [];
  for (const membership of memberships) {
    const user = userMap.get(membership.userId);
    if (!user || user.status !== "active" || !user.email.trim()) continue;
    const memberRoles = membership.roleIds
      .map((id) => roleMap.get(id))
      .filter((role): role is IdentityRole => Boolean(role));
    const code = getTargetRoleCode(memberRoles);
    people.push({
      userId: user._id,
      name: user.displayName.trim() || user.email,
      email: user.email.trim(),
      admin: isSpaceAdministratorRole(code),
    });
  }
  return people.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
