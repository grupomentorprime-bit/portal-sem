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
  const now = new Date().toISOString();
  const existing = await listRolesByTenant(tenantId);
  const existingByName = new Map(existing.map((role) => [role.name, role]));
  const templateByName = new Map(TENANT_ROLES.map((template) => [template.name, template]));

  const missing = TENANT_ROLES.filter((template) => !existingByName.has(template.name));
  if (missing.length > 0) {
    const roles: IdentityRole[] = missing.map((template) => ({
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
  }

  if (existing.length === 0 && missing.length === TENANT_ROLES.length) {
    return listRolesByTenant(tenantId);
  }

  for (const role of await listRolesByTenant(tenantId)) {
    const template = templateByName.get(role.name);
    if (!role.system || !template) continue;

    const templatePerms = [...template.permissionIds].sort().join(",");
    const rolePerms = [...role.permissionIds].sort().join(",");
    if (templatePerms !== rolePerms) {
      await db.collection<IdentityRole>("identity_roles").updateOne(
        { _id: role._id },
        { $set: { permissionIds: [...template.permissionIds], updatedAt: now } }
      );
    }
  }

  return listRolesByTenant(tenantId);
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
