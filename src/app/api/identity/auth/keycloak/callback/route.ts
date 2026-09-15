import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeKeycloakCode,
  fetchKeycloakUserInfo,
  isKeycloakEnabled,
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
import { logServerError } from "@/core/security/redact";
import { updateUserLastLogin } from "@/lib/identity/users";
import { writeAudit } from "@/lib/identity/audit";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { resolvePostAuthDestination } from "@/core/identity/platform/landing";
import {
  NEXT_COOKIE,
  PKCE_COOKIE,
  STATE_COOKIE,
} from "@/core/identity/auth/oauth-cookies";

export async function GET(request: Request) {
  if (!isKeycloakEnabled()) {
    return NextResponse.redirect(new URL("/admin/login?error=keycloak", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get(STATE_COOKIE)?.value;
  const codeVerifier = jar.get(PKCE_COOKIE)?.value;
  const nextPath = jar.get(NEXT_COOKIE)?.value || "/admin";

  // Consumir cookies de un solo uso antes de validar / intercambiar.
  jar.delete(STATE_COOKIE);
  jar.delete(PKCE_COOKIE);
  jar.delete(NEXT_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth_state", request.url));
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth_pkce", request.url));
  }

  try {
    // Preferencia de host (invitación/bootstrap SEM); no ata la identidad a SEM.
    const preferredTenantId = await resolveActiveTenantIdFromRequest();

    const tokens = await exchangeKeycloakCode(code, codeVerifier);
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

    const destination = resolvePostAuthDestination({
      hasSpace: Boolean(activeTenantId),
      isPlatformOperator: hasPlatformOperatorCapability(user),
      next: nextPath,
    });
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof KeycloakAccessError) {
      return NextResponse.redirect(new URL(`/admin/login?error=${error.code}`, request.url));
    }
    logServerError("keycloak-callback", error);
    return NextResponse.redirect(new URL("/admin/login?error=keycloak", request.url));
  }
}
