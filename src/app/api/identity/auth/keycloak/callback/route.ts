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
  readRequestCookie,
  STATE_COOKIE,
} from "@/core/identity/auth/oauth-cookies";
import { publicRedirectUrl } from "@/core/identity/auth/public-origin";

function redirectTo(request: Request, path: string): NextResponse {
  const response = NextResponse.redirect(publicRedirectUrl(request, path));
  const secure = response.headers.get("location")?.startsWith("https://") ?? false;
  const clear = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(STATE_COOKIE, "", clear);
  response.cookies.set(PKCE_COOKIE, "", clear);
  response.cookies.set(NEXT_COOKIE, "", clear);
  return response;
}

export async function GET(request: Request) {
  if (!isKeycloakEnabled()) {
    return redirectTo(request, "/admin/login?error=keycloak");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie");
  const jar = await cookies();
  const savedState =
    readRequestCookie(cookieHeader, STATE_COOKIE) ?? jar.get(STATE_COOKIE)?.value ?? null;
  const codeVerifier =
    readRequestCookie(cookieHeader, PKCE_COOKIE) ?? jar.get(PKCE_COOKIE)?.value ?? null;
  const nextPath =
    readRequestCookie(cookieHeader, NEXT_COOKIE) ?? jar.get(NEXT_COOKIE)?.value ?? "/admin";

  if (!code || !state || !savedState || state !== savedState) {
    return redirectTo(request, "/admin/login?error=oauth_state");
  }

  if (!codeVerifier) {
    return redirectTo(request, "/admin/login?error=oauth_pkce");
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
    return redirectTo(request, destination);
  } catch (error) {
    if (error instanceof KeycloakAccessError) {
      return redirectTo(request, `/admin/login?error=${error.code}`);
    }
    logServerError("keycloak-callback", error);
    return redirectTo(request, "/admin/login?error=keycloak");
  }
}
