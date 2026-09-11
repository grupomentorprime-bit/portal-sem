import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
import { SESSION_COOKIE } from "../../src/core/identity/auth/config";

function makeRequest(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("OT-GROWTH-TEST-001 — gate admin sin sesión", () => {
  it("redirige /admin a /admin/login cuando no hay cookie de sesión", () => {
    const res = proxy(makeRequest("/admin"));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")!).pathname, "/admin/login");
    assert.equal(new URL(res.headers.get("location")!).searchParams.get("next"), "/admin");
  });

  it("permite /admin/login sin cookie", () => {
    const res = proxy(makeRequest("/admin/login"));
    assert.equal(res.status, 200);
  });

  it("permite /admin con cookie ah_session presente", () => {
    const res = proxy(makeRequest("/admin/pages", `${SESSION_COOKIE}=sess-test`));
    assert.equal(res.status, 200);
  });

  it("no exige sesión en rutas públicas del portal", () => {
    for (const path of ["/", "/programas", "/admision", "/formularios", "/contacto"]) {
      const res = proxy(makeRequest(path));
      assert.equal(res.status, 200, path);
    }
  });

  it("marca focused en /formularios/[id] sin redirigir a login", () => {
    const res = proxy(makeRequest("/formularios/convocatoria-talca-aurora-jul-2026"));
    assert.equal(res.status, 200);
  });
});
