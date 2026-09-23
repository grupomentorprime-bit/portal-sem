import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/core/identity/auth/config";
import { applyPrivateNoStoreHeader } from "@/core/security/http-headers";
import { isPlatformOriginHost, resolveRequestHost } from "@/core/tenant/hosts";
import { publicRedirectUrl } from "@/core/identity/auth/public-origin";

function withPrivateCacheControl(response: NextResponse, pathname: string) {
  applyPrivateNoStoreHeader(response.headers, pathname);
  return response;
}

function continueWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set("x-pathname", pathname);
  if (/^\/formularios\/[^/]+$/.test(pathname)) {
    requestHeaders.set("x-form-focused", "1");
  }
  return withPrivateCacheControl(
    NextResponse.next({ request: { headers: requestHeaders } }),
    pathname
  );
}

function isPlatformProductPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/ingresar") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = resolveRequestHost(request.headers);

  if (isPlatformOriginHost(host) && !isPlatformProductPath(pathname)) {
    return withPrivateCacheControl(
      NextResponse.redirect(publicRedirectUrl(request, "/admin")),
      pathname
    );
  }

  // OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — GET handshake Meta / POST firmado:
  // públicos; excluidos del gate de sesión (IDENTITY_ENFORCE no aplica aquí).
  if (pathname.startsWith("/api/webhooks/")) {
    return continueWithPathname(request);
  }

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/platform");

  if (!isProtected) {
    return continueWithPathname(request);
  }

  if (pathname === "/admin/login") {
    return continueWithPathname(request);
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    const loginUrl = publicRedirectUrl(request, "/admin/login");
    loginUrl.searchParams.set("next", pathname);
    return withPrivateCacheControl(NextResponse.redirect(loginUrl), pathname);
  }

  return continueWithPathname(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
