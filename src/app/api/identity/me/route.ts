import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/core/identity";
import { findRolesByIds } from "@/lib/identity/roles";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    const roles = ctx.membership
      ? await findRolesByIds(ctx.tenantId, ctx.membership.roleIds)
      : [];

    return NextResponse.json({
      ok: true,
      user: {
        id: ctx.user._id,
        email: ctx.user.email,
        displayName: ctx.user.displayName,
        lastLoginAt: ctx.user.lastLoginAt,
      },
      tenantId: ctx.tenantId,
      permissions: ctx.permissions,
      roles: roles.map((r) => ({ id: r._id, name: r.name })),
      compatMode: ctx.compatMode,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export { isAuthContext };
