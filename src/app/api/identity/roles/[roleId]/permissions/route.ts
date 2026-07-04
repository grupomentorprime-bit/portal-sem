import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import {
  ensureTenantRoles,
  getRoleCode,
  updateRolePermissionMap,
} from "@/lib/identity/roles";
import { resolveRolePermissionMap } from "@/lib/identity/permission-resolver";
import { normalizePermissionMap } from "@/core/identity/permissions/resolver";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { ROLE_CODES } from "@/core/identity/roles/codes";

interface RouteContext {
  params: Promise<{ roleId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("identity.roles.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { roleId } = await context.params;
    await ensureTenantRoles(ctx.tenantId);
    const roles = await ensureTenantRoles(ctx.tenantId);
    const role = roles.find((r) => r._id === roleId);

    if (!role || role.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 404 });
    }

    const code = getRoleCode(role);
    const permissionMap = resolveRolePermissionMap(role);

    return NextResponse.json({
      ok: true,
      role: {
        id: role._id,
        code,
        name: role.name,
        label: getInstitutionalRoleLabel(code ?? role.name),
        system: role.system,
      },
      permissionMap,
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
    if (code === ROLE_CODES.SUPER_ADMIN && ctx.permissions.includes("identity.roles.manage") === false) {
      return NextResponse.json(
        { ok: false, error: "No se puede modificar la plantilla del Super Admin." },
        { status: 403 }
      );
    }

    const permissionMap = normalizePermissionMap(body.permissionMap);
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
