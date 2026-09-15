import { NextResponse } from "next/server";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { logServerError } from "@/core/security/redact";
import {
  keycloakUserNeedsPassword,
  setKeycloakPasswordForInvite,
} from "@/lib/identity/keycloak-admin";
import { acceptInvitation, findInvitationByToken } from "@/lib/identity/invitations";
import {
  ensureActiveMembership,
  findMembership,
  MembershipConflictError,
} from "@/lib/identity/memberships";
import { createSession, getRequestMeta, setSessionCookie } from "@/lib/identity/sessions";
import { findUserByEmail, updateUserLastLogin } from "@/lib/identity/users";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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

  if (isKeycloakOnlyAuth()) {
    return handleKeycloakAccept(invitation, body);
  }

  return handleLocalAccept(invitation, body);
}

/**
 * Tras provisionar password en Keycloak, NO usa ROPC (DAG OFF en growth-os-web).
 * Deja membresía lista y pide Auth Code + PKCE vía /admin/login.
 */
async function handleKeycloakAccept(
  invitation: NonNullable<Awaited<ReturnType<typeof findInvitationByToken>>>,
  body: { password?: string }
) {
  const existing = await findUserByEmail(invitation.email);
  const needsPassword = await keycloakUserNeedsPassword(invitation.email);

  if (!needsPassword) {
    const { createUser } = await import("@/lib/identity/users");
    const user =
      existing ??
      (await createUser({
        email: invitation.email,
        displayName: invitation.displayName,
        emailVerified: true,
      }));

    const active = await findMembership(user._id, invitation.tenantId);
    if (active) {
      await acceptInvitation(invitation._id, user._id, invitation.tenantId);
      return NextResponse.json({
        ok: true,
        userId: user._id,
        existing: true,
        redirectLogin: true,
      });
    }

    try {
      await ensureActiveMembership({
        tenantId: invitation.tenantId,
        userId: user._id,
        roleIds: invitation.roleIds,
        invitedBy: invitation.invitedBy,
      });
    } catch (error) {
      if (!(error instanceof MembershipConflictError)) throw error;
    }
    await acceptInvitation(invitation._id, user._id, invitation.tenantId);

    return NextResponse.json({
      ok: true,
      userId: user._id,
      existing: true,
      redirectLogin: true,
    });
  }

  if (!body.password || body.password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const passwordResult = await setKeycloakPasswordForInvite({
    email: invitation.email,
    displayName: invitation.displayName,
    password: body.password,
  });

  if (!passwordResult.ok) {
    return NextResponse.json(
      { ok: false, error: "No se pudo completar el acceso. Intenta de nuevo." },
      { status: passwordResult.code === "not_configured" ? 503 : 502 }
    );
  }

  try {
    const { createUser } = await import("@/lib/identity/users");
    const user =
      existing ??
      (await createUser({
        email: invitation.email,
        displayName: invitation.displayName,
        emailVerified: true,
      }));

    try {
      await ensureActiveMembership({
        tenantId: invitation.tenantId,
        userId: user._id,
        roleIds: invitation.roleIds,
        invitedBy: invitation.invitedBy,
      });
    } catch (error) {
      if (!(error instanceof MembershipConflictError)) throw error;
    }
    await acceptInvitation(invitation._id, user._id, invitation.tenantId);

    // Sesión solo vía Authorization Code + PKCE (cliente growth-os-web sin DAG).
    return NextResponse.json({
      ok: true,
      userId: user._id,
      existing: false,
      redirectLogin: true,
    });
  } catch (error) {
    logServerError("invite-keycloak", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar el acceso. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

async function handleLocalAccept(
  invitation: NonNullable<Awaited<ReturnType<typeof findInvitationByToken>>>,
  body: { password?: string; displayName?: string }
) {
  const { registerWithEmail } = await import("@/core/identity");
  const existing = await findUserByEmail(invitation.email);

  if (existing) {
    const active = await findMembership(existing._id, invitation.tenantId);
    if (!active) {
      await ensureActiveMembership({
        tenantId: invitation.tenantId,
        userId: existing._id,
        roleIds: invitation.roleIds,
        invitedBy: invitation.invitedBy,
      });
    }
    await acceptInvitation(invitation._id, existing._id, invitation.tenantId);

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

  await acceptInvitation(invitation._id, result.user._id, invitation.tenantId);
  return NextResponse.json({ ok: true, userId: result.user._id, existing: false });
}
