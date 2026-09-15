import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/core/identity/auth/config";
import { isPlatformOriginHost, resolveRequestHost } from "@/core/tenant/hosts";

function continueWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set("x-pathname", pathname);
  if (/^\/formularios\/[^/]+$/.test(pathname)) {
    requestHeaders.set("x-form-focused", "1");
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
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
    return NextResponse.redirect(new URL("/admin", request.url));
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
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return continueWithPathname(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
