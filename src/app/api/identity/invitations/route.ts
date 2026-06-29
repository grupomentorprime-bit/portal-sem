import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { createInvitation, listInvitationsByTenant } from "@/lib/identity/invitations";
import { ensureTenantRoles, findRoleByName } from "@/lib/identity/roles";
import { writeAudit } from "@/lib/identity/audit";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const invitations = await listInvitationsByTenant(ctx.tenantId);
    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as { email?: string; roleName?: string };
    if (!body.email?.trim()) {
      return NextResponse.json({ ok: false, error: "Email obligatorio." }, { status: 400 });
    }

    await ensureTenantRoles(ctx.tenantId);
    const role = body.roleName
      ? await findRoleByName(ctx.tenantId, body.roleName)
      : await findRoleByName(ctx.tenantId, "Editor");

    if (!role) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 400 });
    }

    const invitation = await createInvitation({
      tenantId: ctx.tenantId,
      email: body.email,
      roleIds: [role._id],
      invitedBy: ctx.user._id,
    });

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "user.invite",
        entity: "invitation",
        entityId: invitation._id,
        metadata: { email: body.email, role: role.name },
      });
    }

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
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
