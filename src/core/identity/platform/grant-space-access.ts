import type { Db } from "mongodb";
import type {
  IdentityAuditEntry,
  IdentityMembership,
  IdentityRole,
} from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import {
  getTenantRolesForSync,
  roleIdForTenant,
} from "@/core/identity/roles/defaults";
import { getDefaultRolePermissionTemplate } from "@/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "@/core/identity/permissions/resolver";
import { findTenantById } from "@/core/tenant/repositories";
import { SPACE_ACCESS_REQUIRED_MESSAGE } from "@/core/identity/platform/enter-messages";

export { SPACE_ACCESS_REQUIRED_MESSAGE };

export class PlatformEnterSpaceError extends Error {
  readonly code:
    | "space_not_found"
    | "support_role_missing"
    | "forbidden_role";
  readonly status: number;

  constructor(
    code: PlatformEnterSpaceError["code"],
    message: string,
    status = 400
  ) {
    super(message);
    this.name = "PlatformEnterSpaceError";
    this.code = code;
    this.status = status;
  }
}

export async function operatorHasActiveSpaceAccess(
  db: Db,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const membership = await db
    .collection<IdentityMembership>("identity_memberships")
    .findOne({ userId, tenantId, status: "active" });
  return Boolean(membership);
}

async function ensureSupportRole(db: Db, tenantId: string): Promise<IdentityRole> {
  const supportId = roleIdForTenant(tenantId, ROLE_CODES.SUPPORT);
  const existing = await db.collection<IdentityRole>("identity_roles").findOne({
    $or: [
      { _id: supportId, tenantId },
      { tenantId, code: ROLE_CODES.SUPPORT },
    ],
  });
  if (existing) return existing;

  const template = getTenantRolesForSync("portal").find(
    (role) => role.code === ROLE_CODES.SUPPORT
  );
  if (!template) {
    throw new PlatformEnterSpaceError(
      "support_role_missing",
      "No existe el rol de Soporte en este Espacio.",
      500
    );
  }

  const now = new Date().toISOString();
  const permissionMap = getDefaultRolePermissionTemplate(ROLE_CODES.SUPPORT);
  const role: IdentityRole = {
    _id: supportId,
    tenantId,
    code: ROLE_CODES.SUPPORT,
    name: template.name,
    description: template.description,
    permissionIds: granularToLegacyPermissions(permissionMap),
    permissionMap,
    system: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<IdentityRole>("identity_roles").insertOne(role);
  return role;
}

/**
 * Alta explícita y mínima de acceso del operador al Espacio.
 * Crea membresía real con rol `support`. Nunca asigna `super_admin`.
 */
export async function grantOperatorSpaceAccess(
  db: Db,
  input: {
    tenantId: string;
    operatorUserId: string;
  }
): Promise<{
  membershipId: string;
  roleCode: typeof ROLE_CODES.SUPPORT;
  created: boolean;
  reactivated: boolean;
}> {
  const tenantId = input.tenantId.trim();
  if (!tenantId) {
    throw new PlatformEnterSpaceError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const tenant = await findTenantById(db, tenantId);
  if (!tenant) {
    throw new PlatformEnterSpaceError(
      "space_not_found",
      "Espacio no encontrado.",
      404
    );
  }

  const supportRole = await ensureSupportRole(db, tenantId);
  const ownerId = roleIdForTenant(tenantId, ROLE_CODES.SUPER_ADMIN);
  if (supportRole._id === ownerId || supportRole.code === ROLE_CODES.SUPER_ADMIN) {
    throw new PlatformEnterSpaceError(
      "forbidden_role",
      "No se puede otorgar el rol de Dueño desde Platform Admin.",
      500
    );
  }

  const memberships = db.collection<IdentityMembership>("identity_memberships");
  const existing = await memberships.findOne({
    userId: input.operatorUserId,
    tenantId,
  });

  const writeGrantAudit = async (
    membershipId: string,
    metadata: Record<string, unknown>
  ) => {
    const entry: IdentityAuditEntry = {
      _id: generateId("audit"),
      userId: input.operatorUserId,
      action: "platform.space.access.grant",
      entity: "membership",
      entityId: membershipId,
      metadata: {
        tenantId,
        roleCode: ROLE_CODES.SUPPORT,
        neverOwner: true,
        ...metadata,
      },
      scope: "platform",
      createdAt: new Date().toISOString(),
    };
    await db.collection<IdentityAuditEntry>("identity_audit").insertOne(entry);
  };

  if (existing) {
    const now = new Date().toISOString();
    let reactivated = false;
    const $set: Record<string, unknown> = { updatedAt: now };

    if (existing.status !== "active") {
      $set.status = "active";
      reactivated = true;
    }
    if (existing.roleIds.length === 0) {
      $set.roleIds = [supportRole._id];
    }

    if (Object.keys($set).length > 1 || reactivated) {
      await memberships.updateOne({ _id: existing._id }, { $set });
    }

    await writeGrantAudit(existing._id, {
      created: false,
      reactivated,
      existingRoleIds: existing.roleIds,
    });

    return {
      membershipId: existing._id,
      roleCode: ROLE_CODES.SUPPORT,
      created: false,
      reactivated,
    };
  }

  const now = new Date().toISOString();
  const membership: IdentityMembership = {
    _id: generateId("mem"),
    tenantId,
    userId: input.operatorUserId,
    roleIds: [supportRole._id],
    status: "active",
    joinedAt: now,
    invitedBy: input.operatorUserId,
    createdAt: now,
    updatedAt: now,
  };
  await memberships.insertOne(membership);

  await writeGrantAudit(membership._id, {
    created: true,
    reactivated: false,
  });

  return {
    membershipId: membership._id,
    roleCode: ROLE_CODES.SUPPORT,
    created: true,
    reactivated: false,
  };
}
