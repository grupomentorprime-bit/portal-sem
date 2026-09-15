import { NextResponse } from "next/server";
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
import { resolveActiveTenantIdFromRequest } from "@/core/tenant/context";
import { updateUserLastLogin } from "@/lib/identity/users";
import { writeAudit } from "@/lib/identity/audit";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { resolvePostAuthDestination } from "@/core/identity/platform/landing";
import { publicInternalError } from "@/core/security/public-error";

/**
 * Login embebido de Growth OS: el navegador nunca va a Keycloak.
 * El servidor valida correo/contraseña contra el IdP (ROPC) y emite sesión opaca.
 */
export async function POST(request: Request) {
  if (!isKeycloakOnlyAuth() || !isKeycloakEnabled()) {
    return NextResponse.json(
      { ok: false, error: "El inicio de sesión no está disponible en este momento." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      next?: string;
    };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const preferredTenantId = await resolveActiveTenantIdFromRequest();
    const tokens = await loginWithKeycloakPassword({ username: email, password });
    const profile = await fetchKeycloakUserInfo(tokens.accessToken);
    const { user, activeTenantId } = await finishKeycloakLogin(
      profile,
      preferredTenantId,
      tokens.accessToken
    );

    const meta = await getRequestMeta();
    const session = await createSession({
      userId: user._id,
      tenantId: activeTenantId ?? "",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await setSessionCookie(session._id);
    await updateUserLastLogin(user._id);

    await writeAudit({
      tenantId: activeTenantId || preferredTenantId || "none",
      userId: user._id,
      action: "auth.login.keycloak",
      entity: "session",
      entityId: session._id,
    });

    const isPlatformOperator = hasPlatformOperatorCapability(user);
    const redirectTo = resolvePostAuthDestination({
      hasSpace: Boolean(activeTenantId),
      isPlatformOperator,
      next: body.next,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      activeTenantId,
      hasSpace: Boolean(activeTenantId),
      isPlatformOperator,
      redirectTo,
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

    return publicInternalError("keycloak-embedded-login", error);
  }
}
