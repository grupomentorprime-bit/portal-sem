import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { findMembershipById, updateMembershipRoles } from "@/lib/identity/memberships";
import { ensureTenantRoles, findRoleByName, findRolesByIds } from "@/lib/identity/roles";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);

    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as { roleName?: string; roleId?: string };
    const roleKey = body.roleId?.trim() || body.roleName?.trim();

    if (!roleKey) {
      return NextResponse.json({ ok: false, error: "Rol obligatorio." }, { status: 400 });
    }

    await ensureTenantRoles(ctx.tenantId);
    const role = body.roleId
      ? (await findRolesByIds(ctx.tenantId, [body.roleId]))[0] ?? null
      : await findRoleByName(ctx.tenantId, body.roleName!);

    if (!role) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 400 });
    }

    const updated = await updateMembershipRoles(membershipId, [role._id]);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar el rol." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.roles.update",
        entity: "membership",
        entityId: membershipId,
        metadata: { role: role.name, targetUserId: membership.userId },
      });
    }

    return NextResponse.json({
      ok: true,
      membership: {
        id: updated._id,
        roleIds: updated.roleIds,
        roleName: role.name,
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
