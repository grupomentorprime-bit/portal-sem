import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { resendPendingInvitationEmail } from "@/lib/identity/resend-access";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as { invitationId?: string };
    const invitationId = body.invitationId?.trim();
    if (!invitationId) {
      return NextResponse.json(
        { ok: false, error: "ID de invitación obligatorio." },
        { status: 400 }
      );
    }

    const result = await resendPendingInvitationEmail({
      tenantId: ctx.tenantId,
      invitationId,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "user.invite.resend",
        entity: "invitation",
        entityId: invitationId,
        metadata: { email: result.email },
      });
    }

    return NextResponse.json({ ok: true, email: result.email, message: result.message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo enviar el correo." },
      { status: 500 }
    );
  }
}
