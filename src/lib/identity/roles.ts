import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityRole } from "@/types/identity";
import {
  getTenantRolesForSync,
  roleIdForTenant,
  roleSlug,
  type TenantRoleSyncMode,
} from "@/core/identity/roles/defaults";
import {
  LEGACY_ROLE_NAME_TO_CODE,
  ROLE_CODES,
  resolveRoleCode,
  type RoleCode,
} from "@/core/identity/roles/codes";
import { getDefaultRolePermissionTemplate } from "@/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "@/core/identity/permissions/resolver";

export function getRoleCode(role: IdentityRole): RoleCode | null {
  if (role.code) return resolveRoleCode(role.code);
  return resolveRoleCode(role.name);
}

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
  roleIds: string[],
  membership?: import("@/types/identity").IdentityMembership | null
): Promise<string[]> {
  const { resolvePermissionsForRoles: resolveGranular } = await import(
    "@/lib/identity/permission-resolver"
  );
  return resolveGranular(tenantId, roleIds, membership);
}

export async function getCallerRoleCode(
  tenantId: string,
  roleIds: string[]
): Promise<RoleCode | null> {
  const roles = await findRolesByIds(tenantId, roleIds);
  if (!roles.length) return null;
  const codes = roles.map(getRoleCode).filter(Boolean) as RoleCode[];
  if (codes.includes(ROLE_CODES.SUPER_ADMIN)) return ROLE_CODES.SUPER_ADMIN;
  if (codes.includes(ROLE_CODES.INSTITUTION_ADMIN)) return ROLE_CODES.INSTITUTION_ADMIN;
  if (codes.includes(ROLE_CODES.SUPPORT)) return ROLE_CODES.SUPPORT;
  return codes[0] ?? null;
}

export async function ensureTenantRoles(
  tenantId: string,
  mode: TenantRoleSyncMode = "portal"
): Promise<IdentityRole[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const templates = getTenantRolesForSync(mode);
  const existing = await listRolesByTenant(tenantId);

  const existingByCode = new Map<string, IdentityRole>();
  const existingByName = new Map<string, IdentityRole>();
  for (const role of existing) {
    const code = getRoleCode(role);
    if (code) existingByCode.set(code, role);
    existingByName.set(role.name, role);
  }

  for (const template of templates) {
    const targetId = roleIdForTenant(tenantId, template.code);
    let current =
      existingByCode.get(template.code) ??
      existingByName.get(template.name) ??
      existing.find((r) => r._id === targetId) ??
      null;

    // Migrar rol legacy por nombre antiguo
    if (!current) {
      for (const [legacyName, legacyCode] of Object.entries(LEGACY_ROLE_NAME_TO_CODE)) {
        if (legacyCode === template.code && existingByName.has(legacyName)) {
          current = existingByName.get(legacyName)!;
          break;
        }
      }
    }

    if (!current) {
      const permissionMap = getDefaultRolePermissionTemplate(template.code);
      const role: IdentityRole = {
        _id: targetId,
        tenantId,
        code: template.code,
        name: template.name,
        description: template.description,
        permissionIds: granularToLegacyPermissions(permissionMap),
        permissionMap,
        system: template.system,
        createdAt: now,
        updatedAt: now,
      };
      await db.collection<IdentityRole>("identity_roles").insertOne(role);
      continue;
    }

    const updates: Partial<IdentityRole> = {};
    if (current.code !== template.code) updates.code = template.code;
    if (current.name !== template.name) updates.name = template.name;
    if (current.description !== template.description) updates.description = template.description;

    if (current.system && !current.permissionMap) {
      const permissionMap = getDefaultRolePermissionTemplate(template.code);
      updates.permissionMap = permissionMap;
      updates.permissionIds = granularToLegacyPermissions(permissionMap);
    }

    const templatePerms = [...template.permissionIds].sort().join(",");
    const rolePerms = [...current.permissionIds].sort().join(",");
    if (current.system && templatePerms !== rolePerms && !updates.permissionIds) {
      updates.permissionIds = [...template.permissionIds];
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await db.collection<IdentityRole>("identity_roles").updateOne(
        { _id: current._id },
        { $set: updates }
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
  const direct = await db.collection<IdentityRole>("identity_roles").findOne({ tenantId, name });
  if (direct) return direct;

  const code = resolveRoleCode(name);
  if (code) return findRoleByCode(tenantId, code);
  return null;
}

export async function findRoleByCode(
  tenantId: string,
  code: RoleCode
): Promise<IdentityRole | null> {
  const db = await getDatabase();
  const byCode = await db.collection<IdentityRole>("identity_roles").findOne({ tenantId, code });
  if (byCode) return byCode;

  const targetId = roleIdForTenant(tenantId, code);
  const byId = await db.collection<IdentityRole>("identity_roles").findOne({ _id: targetId });
  if (byId) return byId;

  for (const [legacyName, legacyCode] of Object.entries(LEGACY_ROLE_NAME_TO_CODE)) {
    if (legacyCode === code) {
      return db.collection<IdentityRole>("identity_roles").findOne({ tenantId, name: legacyName });
    }
  }
  return null;
}

export async function updateRolePermissionMap(
  tenantId: string,
  roleId: string,
  permissionMap: Record<string, boolean>
): Promise<IdentityRole | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const permissionIds = granularToLegacyPermissions(permissionMap);
  await db.collection<IdentityRole>("identity_roles").updateOne(
    { _id: roleId, tenantId },
    { $set: { permissionMap, permissionIds, updatedAt: now } }
  );
  return db.collection<IdentityRole>("identity_roles").findOne({ _id: roleId, tenantId });
}

export async function getSuperAdminRole(tenantId: string): Promise<IdentityRole | null> {
  await ensureTenantRoles(tenantId);
  return findRoleByCode(tenantId, ROLE_CODES.SUPER_ADMIN);
}

/** @deprecated Use getSuperAdminRole — alias de compatibilidad */
export async function getOwnerRole(tenantId: string): Promise<IdentityRole | null> {
  return getSuperAdminRole(tenantId);
}

export async function ensureSuperAdminMembership(
  tenantId: string,
  userId: string
): Promise<void> {
  const superAdminRole = await getSuperAdminRole(tenantId);
  if (!superAdminRole) return;

  const { markUserAsSystemAccount } = await import("@/lib/identity/users");
  await markUserAsSystemAccount(userId);

  const { findMembership, updateMembershipRoles, createMembership } = await import(
    "@/lib/identity/memberships"
  );
  const existing = await findMembership(userId, tenantId);
  if (existing) {
    const hasSuperAdmin = existing.roleIds.some((id) => id === superAdminRole._id);
    if (!hasSuperAdmin) {
      await updateMembershipRoles(existing._id, [superAdminRole._id]);
    }
    return;
  }
  await createMembership({
    tenantId,
    userId,
    roleIds: [superAdminRole._id],
  });
}

export { roleSlug };
