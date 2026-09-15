/**
 * OT-GROWTH-SECURITY-HARDENING-002 — cabeceras, CSP y no-store.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import {
  PRIVATE_CACHE_CONTROL,
  buildAppSecurityHeaders,
  buildContentSecurityPolicy,
  shouldApplyPrivateNoStore,
} from "../../src/core/security/http-headers";
import { proxy } from "../../src/proxy";
import { SESSION_COOKIE } from "../../src/core/identity/auth/config";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function makeRequest(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  headers.set("host", "localhost:3000");
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("OT-GROWTH-SECURITY-HARDENING-002 — config", () => {
  it("next.config desactiva X-Powered-By y declara headers de seguridad + no-store", () => {
    const cfg = readSrc("next.config.ts");
    assert.match(cfg, /poweredByHeader:\s*false/);
    assert.match(cfg, /buildAppSecurityHeaders/);
    assert.match(cfg, /PRIVATE_CACHE_CONTROL/);
    assert.match(cfg, /\/admin\/:path\*/);
    assert.match(cfg, /\/platform\/:path\*/);
    assert.match(cfg, /\/api\/identity\/:path\*/);
    assert.doesNotMatch(cfg, /Strict-Transport-Security/);
  });

  it("CSP mínima sin unsafe-eval en producción ni host wildcards", () => {
    const csp = buildContentSecurityPolicy({
      NODE_ENV: "production",
      KEYCLOAK_URL: "https://auth.example.cl",
      S3_PUBLIC_URL: "https://cdn.example.cl/media",
    });
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /form-action 'self' https:\/\/auth\.example\.cl/);
    assert.match(csp, /img-src[^;]*https:\/\/cdn\.example\.cl/);
    assert.match(csp, /connect-src[^;]*https:\/\/auth\.example\.cl/);
    assert.doesNotMatch(csp, /unsafe-eval/);
    // Sin comodín de esquema/host (p. ej. `https:` o `*.cdn.com`).
    assert.doesNotMatch(csp, /(?:^|[\s;])https:(?:[\s;]|$)/);
    assert.doesNotMatch(csp, /\*\./);
  });

  it("CSP de desarrollo permite unsafe-eval solo para HMR de Next", () => {
    const csp = buildContentSecurityPolicy({ NODE_ENV: "development" });
    assert.match(csp, /unsafe-eval/);
  });

  it("buildAppSecurityHeaders incluye nosniff, referrer y permissions", () => {
    const headers = buildAppSecurityHeaders({ NODE_ENV: "production" });
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    assert.equal(map["X-Content-Type-Options"], "nosniff");
    assert.equal(map["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.match(map["Permissions-Policy"]!, /camera=\(\)/);
    assert.match(map["Content-Security-Policy"]!, /script-src 'self'/);
  });
});

describe("OT-GROWTH-SECURITY-HARDENING-002 — no-store selectivo", () => {
  it("marca privadas login/admin/platform/APIs de identidad y Growth", () => {
    for (const path of [
      "/admin",
      "/admin/login",
      "/admin/mensajes",
      "/platform",
      "/api/identity/auth/keycloak/login",
      "/api/identity/auth/keycloak/callback",
      "/api/identity/logout",
      "/api/identity/me",
      "/api/growth/campaigns",
      "/api/platform/spaces",
      "/api/cms/pages/abc",
    ]) {
      assert.equal(shouldApplyPrivateNoStore(path), true, path);
    }
  });

  it("no aplica no-store a stream público, webhooks ni estáticos lógicos", () => {
    for (const path of [
      "/api/cms/media/stream",
      "/api/webhooks/whatsapp",
      "/api/admission/apply",
      "/api/experience/forms/f1/public",
      "/api/experience/forms/f1/submit",
      "/",
      "/programas",
    ]) {
      assert.equal(shouldApplyPrivateNoStore(path), false, path);
    }
  });

  it("proxy adjunta Cache-Control: no-store en /admin y /platform", () => {
    const admin = proxy(makeRequest("/admin/login"));
    assert.equal(admin.headers.get("cache-control"), PRIVATE_CACHE_CONTROL);

    const platform = proxy(
      makeRequest("/platform", `${SESSION_COOKIE}=sess-test`)
    );
    assert.equal(platform.headers.get("cache-control"), PRIVATE_CACHE_CONTROL);

    const publicSite = proxy(makeRequest("/programas"));
    assert.equal(publicSite.headers.get("cache-control"), null);
  });
});

describe("OT-GROWTH-SECURITY-HARDENING-002 — sin regresión de auth", () => {
  it("mantiene Auth Code + PKCE en login/callback Keycloak", () => {
    const login = readSrc("src/app/api/identity/auth/keycloak/login/route.ts");
    const callback = readSrc(
      "src/app/api/identity/auth/keycloak/callback/route.ts"
    );
    const keycloak = readSrc("src/core/identity/auth/keycloak.ts");
    assert.match(login, /createPkcePair/);
    assert.match(callback, /exchangeKeycloakCode\(code,\s*codeVerifier\)/);
    assert.match(keycloak, /code_challenge_method:\s*"S256"/);
  });
});
