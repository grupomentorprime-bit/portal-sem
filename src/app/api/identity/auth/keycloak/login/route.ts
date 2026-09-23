import { NextResponse } from "next/server";
import { generateToken } from "@/core/identity/auth/crypto";
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
import { resolvePublicAppOrigin } from "@/core/identity/auth/public-origin";

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

  const secure = resolvePublicAppOrigin(request).startsWith("https://");
  const cookieBase = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };

  const authorizeUrl = buildKeycloakAuthorizeUrl(state, codeChallenge);
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, cookieBase);
  response.cookies.set(PKCE_COOKIE, codeVerifier, cookieBase);
  response.cookies.set(
    NEXT_COOKIE,
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/admin",
    cookieBase
  );
  return response;
}
