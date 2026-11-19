import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/core/identity/auth/config";
import { applyPrivateNoStoreHeader, buildContentSecurityPolicy } from "@/core/security/http-headers";
import { isPlatformOriginHost, resolveRequestHost } from "@/core/tenant/hosts";
import { publicRedirectUrl } from "@/core/identity/auth/public-origin";
import { toGrowthLoginPath } from "@/lib/identity/login-route";

function requestNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function withDocumentHeaders(
  response: NextResponse,
  pathname: string,
  csp: string
) {
  applyPrivateNoStoreHeader(response.headers, pathname);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function continueWithPathname(request: NextRequest, nonce: string, csp: string) {
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  if (/^\/formularios\/[^/]+$/.test(pathname)) {
    requestHeaders.set("x-form-focused", "1");
  }
  return withDocumentHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    pathname,
    csp
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
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/escritorio"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = resolveRequestHost(request.headers);
  const nonce = requestNonce();
  const csp = buildContentSecurityPolicy(process.env, { nonce });
  const next = () => continueWithPathname(request, nonce, csp);
  const redirect = (url: URL) => withDocumentHeaders(NextResponse.redirect(url), pathname, csp);

  if (isPlatformOriginHost(host) && !isPlatformProductPath(pathname)) {
    if (pathname === "/" || pathname === "/ayuda") {
      return next();
    }
    return redirect(publicRedirectUrl(request, "/"));
  }

  // OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — GET handshake Meta / POST firmado:
  // públicos; excluidos del gate de sesión (IDENTITY_ENFORCE no aplica aquí).
  if (pathname.startsWith("/api/webhooks/")) {
    return next();
  }

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/platform") ||
    pathname === "/escritorio";

  if (!isProtected) {
    return next();
  }

  if (pathname === "/admin/login") {
    const loginUrl = publicRedirectUrl(
      request,
      toGrowthLoginPath({
        next: request.nextUrl.searchParams.get("next"),
        error: request.nextUrl.searchParams.get("error"),
      })
    );
    return redirect(loginUrl);
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    const loginUrl = publicRedirectUrl(request, "/login");
    loginUrl.searchParams.set("next", pathname);
    return redirect(loginUrl);
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
