import { NextResponse } from "next/server";
import { registerWithEmail } from "@/core/identity";
import {
  acceptInvitation,
  findInvitationByToken,
} from "@/lib/identity/invitations";
import { createMembership } from "@/lib/identity/memberships";
import { findUserByEmail } from "@/lib/identity/users";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { ok: false, error: "Invitación inválida o expirada." },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      password?: string;
      displayName?: string;
    };

    const existing = await findUserByEmail(invitation.email);

    if (existing) {
      await createMembership({
        tenantId: invitation.tenantId,
        userId: existing._id,
        roleIds: invitation.roleIds,
        invitedBy: invitation.invitedBy,
      });
      await acceptInvitation(invitation._id, existing._id);
      return NextResponse.json({ ok: true, userId: existing._id, existing: true });
    }

    if (!body.password || !body.displayName?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Nombre y contraseña son obligatorios para nuevos usuarios." },
        { status: 400 }
      );
    }

    const result = await registerWithEmail({
      email: invitation.email,
      password: body.password,
      displayName: body.displayName,
      tenantId: invitation.tenantId,
      roleIds: invitation.roleIds,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await acceptInvitation(invitation._id, result.user._id);
    return NextResponse.json({ ok: true, userId: result.user._id, existing: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
