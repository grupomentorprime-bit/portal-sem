import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityRole } from "@/types/identity";
import { TENANT_ROLES, roleSlug } from "@/core/identity/roles/defaults";

export async function listRolesByTenant(tenantId: string): Promise<IdentityRole[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityRole>("identity_roles")
    .find({ tenantId })
    .sort({ name: 1 })
    .toArray();
}

export async function findRolesByIds(
  tenantId: string,
  roleIds: string[]
): Promise<IdentityRole[]> {
  if (!roleIds.length) return [];
  const db = await getDatabase();
  return db
    .collection<IdentityRole>("identity_roles")
    .find({ tenantId, _id: { $in: roleIds } })
    .toArray();
}

export async function resolvePermissionsForRoles(
  tenantId: string,
  roleIds: string[]
): Promise<string[]> {
  const roles = await findRolesByIds(tenantId, roleIds);
  const perms = new Set<string>();
  for (const role of roles) {
    for (const p of role.permissionIds) perms.add(p);
  }
  return [...perms];
}

export async function ensureTenantRoles(tenantId: string): Promise<IdentityRole[]> {
  const db = await getDatabase();
  const existing = await listRolesByTenant(tenantId);
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const roles: IdentityRole[] = TENANT_ROLES.map((template) => ({
    _id: `role-${tenantId}-${roleSlug(template.name)}`,
    tenantId,
    name: template.name,
    description: template.description,
    permissionIds: [...template.permissionIds],
    system: template.system,
    createdAt: now,
    updatedAt: now,
  }));

  await db.collection<IdentityRole>("identity_roles").insertMany(roles);
  return roles;
}

export async function findRoleByName(
  tenantId: string,
  name: string
): Promise<IdentityRole | null> {
  const db = await getDatabase();
  return db.collection<IdentityRole>("identity_roles").findOne({ tenantId, name });
}

export async function getOwnerRole(tenantId: string): Promise<IdentityRole | null> {
  await ensureTenantRoles(tenantId);
  return findRoleByName(tenantId, "Tenant Owner");
}
