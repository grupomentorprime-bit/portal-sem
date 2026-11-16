import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import {
  ensureTenantRoles,
  getCallerRoleCode,
  getRoleCode,
  listRolesByTenant,
  updateRolePermissionMap,
} from "@/lib/identity/roles";
import {
  resolvePermissionDetailsForMembership,
  resolveRolePermissionMap,
} from "@/lib/identity/permission-resolver";
import { normalizePermissionMap } from "@/core/identity/permissions/resolver";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import {
  assertCanWriteProfilePermissions,
  grantablePermissionCodes,
} from "@/lib/identity/enterprise-profiles";

interface RouteContext {
  params: Promise<{ roleId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("identity.roles.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { roleId } = await context.params;
    // Lectura pura — sync de roles solo en login/bootstrap/migración (SAAS-004).
    const roles = await listRolesByTenant(ctx.tenantId);
    const role = roles.find((r) => r._id === roleId);

    if (!role || role.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 404 });
    }

    const code = getRoleCode(role);
    const permissionMap = resolveRolePermissionMap(role);
    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;
    const details = ctx.membership
      ? await resolvePermissionDetailsForMembership(ctx.tenantId, ctx.membership)
      : null;
    const callerEffective = details?.effective ?? {};
    const writeCheck = assertCanWriteProfilePermissions({
      callerCode: callerRoleCode,
      callerEffective,
      role,
      permissionMap,
    });

    return NextResponse.json({
      ok: true,
      role: {
        id: role._id,
        code,
        name: role.name,
        label: code ? getInstitutionalRoleLabel(code) : role.name,
        system: role.system,
      },
      permissionMap,
      grantable: grantablePermissionCodes({ callerEffective, role }),
      readOnly: !writeCheck.ok,
      readOnlyReason: writeCheck.ok ? undefined : writeCheck.error,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("identity.roles.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { roleId } = await context.params;
    const body = (await request.json()) as { permissionMap?: Record<string, boolean> };

    if (!body.permissionMap) {
      return NextResponse.json({ ok: false, error: "permissionMap es obligatorio." }, { status: 400 });
    }

    await ensureTenantRoles(ctx.tenantId);
    const roles = await ensureTenantRoles(ctx.tenantId);
    const role = roles.find((r) => r._id === roleId);

    if (!role || role.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 404 });
    }

    const code = getRoleCode(role);
    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;
    const details = ctx.membership
      ? await resolvePermissionDetailsForMembership(ctx.tenantId, ctx.membership)
      : null;
    const permissionMap = normalizePermissionMap(body.permissionMap);
    const writeCheck = assertCanWriteProfilePermissions({
      callerCode: callerRoleCode,
      callerEffective: details?.effective ?? {},
      role,
      permissionMap,
    });
    if (!writeCheck.ok) {
      return NextResponse.json({ ok: false, error: writeCheck.error }, { status: 403 });
    }
    const updated = await updateRolePermissionMap(ctx.tenantId, roleId, permissionMap);

    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar el rol." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "role.permissions.update",
        entity: "role",
        entityId: roleId,
        metadata: { roleCode: code, permissionMap },
      });
    }

    return NextResponse.json({
      ok: true,
      role: {
        id: updated._id,
        code: getRoleCode(updated),
        permissionMap: updated.permissionMap,
        permissionIds: updated.permissionIds,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
