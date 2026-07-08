import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getActiveTenantId } from "@/core/identity";
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
import { updateUserLastLogin } from "@/lib/identity/users";
import { writeAudit } from "@/lib/identity/audit";

const STATE_COOKIE = "kc_oauth_state";
const NEXT_COOKIE = "kc_oauth_next";

export async function GET(request: Request) {
  if (!isKeycloakEnabled()) {
    return NextResponse.redirect(new URL("/admin/login?error=keycloak", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get(STATE_COOKIE)?.value;
  const nextPath = jar.get(NEXT_COOKIE)?.value || "/admin";
  jar.delete(STATE_COOKIE);
  jar.delete(NEXT_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth_state", request.url));
  }

  try {
    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return NextResponse.redirect(new URL("/admin/login?error=tenant", request.url));
    }

    const tokens = await exchangeKeycloakCode(code);
    const profile = await fetchKeycloakUserInfo(tokens.accessToken);
    const { user } = await finishKeycloakLogin(profile, tenantId, tokens.accessToken);

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

    const isSafeNext = nextPath.startsWith("/") && !nextPath.startsWith("//");
    const nextPathOnly = nextPath.split("?")[0];
    const safeNext =
      isSafeNext && nextPathOnly !== "/admin" && nextPathOnly !== "/admin/config"
        ? nextPath
        : "/admin";
    return NextResponse.redirect(new URL(safeNext, request.url));
  } catch (error) {
    if (error instanceof KeycloakAccessError) {
      return NextResponse.redirect(new URL(`/admin/login?error=${error.code}`, request.url));
    }
    console.error("[keycloak] callback failed", error);
    return NextResponse.redirect(new URL("/admin/login?error=keycloak", request.url));
  }
}
