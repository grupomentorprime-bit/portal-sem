import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { ensureTenantRoles, listRolesByTenant, getRoleCode } from "@/lib/identity/roles";
import { PORTAL_ROLE_CODES } from "@/core/identity/roles/codes";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    await ensureTenantRoles(ctx.tenantId);
    const roles = await listRolesByTenant(ctx.tenantId);

    return NextResponse.json({
      ok: true,
      roles: roles
        .filter((r) => {
          const code = getRoleCode(r);
          return !code || PORTAL_ROLE_CODES.includes(code as typeof PORTAL_ROLE_CODES[number]);
        })
        .map((r) => {
          const code = getRoleCode(r);
          return {
            id: r._id,
            name: r.name,
            code: code ?? undefined,
            label: getInstitutionalRoleLabel(r.name, code ?? undefined),
            description: r.description,
            permissionIds: r.permissionIds,
            system: r.system,
          };
        }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
