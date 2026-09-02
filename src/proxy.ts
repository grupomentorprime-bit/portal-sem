import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/core/identity/auth/config";

function continueWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { pathname } = request.nextUrl;
  requestHeaders.set("x-pathname", pathname);
  if (/^\/formularios\/[^/]+$/.test(pathname)) {
    requestHeaders.set("x-form-focused", "1");
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.IDENTITY_ENFORCE !== "true") {
    return continueWithPathname(request);
  }

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/internal");

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
