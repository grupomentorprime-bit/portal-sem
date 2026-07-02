import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateToken } from "@/core/identity/auth/crypto";
import {
  buildKeycloakAuthorizeUrl,
  isKeycloakEnabled,
} from "@/core/identity/auth/keycloak";

const STATE_COOKIE = "kc_oauth_state";
const NEXT_COOKIE = "kc_oauth_next";

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
  const jar = await cookies();

  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  jar.set(NEXT_COOKIE, nextPath.startsWith("/") ? nextPath : "/admin", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const authorizeUrl = buildKeycloakAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
