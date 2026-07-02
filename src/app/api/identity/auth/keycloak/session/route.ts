import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import {
  fetchKeycloakUserInfo,
  isKeycloakEnabled,
  KeycloakAuthError,
  loginWithKeycloakPassword,
} from "@/core/identity/auth/keycloak";
import {
  finishKeycloakLogin,
  KeycloakAccessError,
} from "@/lib/identity/keycloak-access";
import {
  createSession,
  getRequestMeta,
  setSessionCookie,
} from "@/lib/identity/sessions";
import { updateUserLastLogin } from "@/lib/identity/users";
import { writeAudit } from "@/lib/identity/audit";

export async function POST(request: Request) {
  if (!isKeycloakOnlyAuth() || !isKeycloakEnabled()) {
    return NextResponse.json(
      { ok: false, error: "El inicio de sesión no está disponible en este momento." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Tenant no configurado." }, { status: 503 });
    }

    const tokens = await loginWithKeycloakPassword({ username: email, password });
    const profile = await fetchKeycloakUserInfo(tokens.accessToken);
    const { user } = await finishKeycloakLogin(profile, tenantId);

    const meta = await getRequestMeta();
    const session = await createSession({
      userId: user._id,
      tenantId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await setSessionCookie(session._id);
    await updateUserLastLogin(user._id);

    await writeAudit({
      tenantId,
      userId: user._id,
      action: "auth.login.keycloak",
      entity: "session",
      entityId: session._id,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    if (error instanceof KeycloakAuthError) {
      const status =
        error.code === "invalid_credentials"
          ? 401
          : error.code === "misconfigured"
            ? 503
            : 502;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    if (error instanceof KeycloakAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    console.error("[keycloak] embedded login failed", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar el inicio de sesión." },
      { status: 500 }
    );
  }
}
