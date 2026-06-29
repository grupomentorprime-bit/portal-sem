import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { ensureTenantRoles, listRolesByTenant } from "@/lib/identity/roles";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    await ensureTenantRoles(ctx.tenantId);
    const roles = await listRolesByTenant(ctx.tenantId);

    return NextResponse.json({
      ok: true,
      roles: roles.map((r) => ({
        id: r._id,
        name: r.name,
        description: r.description,
        permissionIds: r.permissionIds,
        system: r.system,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
