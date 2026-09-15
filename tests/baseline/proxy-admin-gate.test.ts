import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
import { SESSION_COOKIE } from "../../src/core/identity/auth/config";

function makeRequest(
  path: string,
  cookie?: string,
  origin = "http://localhost:3000"
): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  headers.set("host", new URL(origin).host);
  return new NextRequest(new URL(path, origin), { headers });
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

describe("Host de plataforma — entrada Growth OS", () => {
  const platformOrigin = "https://growthos.mentorprime.cl";
  const prevApp = process.env.APP_URL;
  const prevPublic = process.env.NEXT_PUBLIC_APP_URL;

  function withPlatformEnv(run: () => void) {
    process.env.APP_URL = platformOrigin;
    process.env.NEXT_PUBLIC_APP_URL = platformOrigin;
    try {
      run();
    } finally {
      if (prevApp === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = prevApp;
      if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevPublic;
    }
  }

  it("redirige / del origen de plataforma a /admin", () => {
    withPlatformEnv(() => {
      const res = proxy(makeRequest("/", undefined, platformOrigin));
      assert.equal(res.status, 307);
      assert.equal(new URL(res.headers.get("location")!).pathname, "/admin");
    });
  });

  it("no intercepta /legal ni /admin/login en el origen de plataforma", () => {
    withPlatformEnv(() => {
      const legal = proxy(makeRequest("/legal/privacidad", undefined, platformOrigin));
      assert.equal(legal.status, 200);
      const login = proxy(makeRequest("/admin/login", undefined, platformOrigin));
      assert.equal(login.status, 200);
    });
  });
});
