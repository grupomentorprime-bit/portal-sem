import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateToken } from "@/core/identity/auth/crypto";
import { isSecureCookieFromHeaders } from "@/core/identity/auth/config";
import {
  buildKeycloakAuthorizeUrl,
  createPkcePair,
  isKeycloakEnabled,
} from "@/core/identity/auth/keycloak";
import {
  NEXT_COOKIE,
  PKCE_COOKIE,
  STATE_COOKIE,
} from "@/core/identity/auth/oauth-cookies";

export async function GET(request: Request) {
  if (!isKeycloakEnabled()) {
    return NextResponse.json(
      { ok: false, error: "El servicio de autenticación no está configurado." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next")?.trim() || "/admin";
  const state = generateToken(16);
  const { codeVerifier, codeChallenge } = createPkcePair();
  const jar = await cookies();

  const secure = isSecureCookieFromHeaders(request.headers);
  const cookieBase = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };

  jar.set(STATE_COOKIE, state, cookieBase);
  jar.set(PKCE_COOKIE, codeVerifier, cookieBase);
  jar.set(NEXT_COOKIE, nextPath.startsWith("/") ? nextPath : "/admin", cookieBase);

  const authorizeUrl = buildKeycloakAuthorizeUrl(state, codeChallenge);
  return NextResponse.redirect(authorizeUrl);
}
