import { NextResponse } from "next/server";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  if (isKeycloakOnlyAuth()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Las invitaciones se activan al iniciar sesión con tu cuenta institucional.",
      },
      { status: 403 }
    );
  }

  const { token } = await params;
  const { findInvitationByToken } = await import("@/lib/identity/invitations");
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    return NextResponse.json(
      { ok: false, error: "Invitación inválida o expirada." },
      { status: 404 }
    );
  }

  const body = (await _request.json()) as {
    password?: string;
    displayName?: string;
  };

  const { registerWithEmail } = await import("@/core/identity");
  const { acceptInvitation } = await import("@/lib/identity/invitations");
  const { createMembership } = await import("@/lib/identity/memberships");
  const { findUserByEmail } = await import("@/lib/identity/users");
  const {
    createSession,
    getRequestMeta,
    setSessionCookie,
  } = await import("@/lib/identity/sessions");
  const { updateUserLastLogin } = await import("@/lib/identity/users");

  const existing = await findUserByEmail(invitation.email);

  if (existing) {
    await createMembership({
      tenantId: invitation.tenantId,
      userId: existing._id,
      roleIds: invitation.roleIds,
      invitedBy: invitation.invitedBy,
    });
    await acceptInvitation(invitation._id, existing._id);

    const meta = await getRequestMeta();
    const session = await createSession({
      userId: existing._id,
      tenantId: invitation.tenantId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await setSessionCookie(session._id);
    await updateUserLastLogin(existing._id);

    return NextResponse.json({ ok: true, userId: existing._id, existing: true });
  }

  if (!body.password || body.password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const result = await registerWithEmail({
    email: invitation.email,
    password: body.password,
    displayName: invitation.displayName.trim(),
    tenantId: invitation.tenantId,
    roleIds: invitation.roleIds,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await acceptInvitation(invitation._id, result.user._id);
  return NextResponse.json({ ok: true, userId: result.user._id, existing: false });
}
