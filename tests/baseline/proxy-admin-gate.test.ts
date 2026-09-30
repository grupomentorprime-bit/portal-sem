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
  it("redirige /admin a /login cuando no hay cookie de sesión", () => {
    const res = proxy(makeRequest("/admin"));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")!).pathname, "/login");
    assert.equal(new URL(res.headers.get("location")!).searchParams.get("next"), "/admin");
  });

  it("permite /login sin cookie y redirige /admin/login hacia /login", () => {
    const login = proxy(makeRequest("/login"));
    assert.equal(login.status, 200);

    const legacy = proxy(makeRequest("/admin/login?error=oauth_state&next=/admin/mensajes"));
    assert.equal(legacy.status, 307);
    const location = new URL(legacy.headers.get("location")!);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("error"), "oauth_state");
    assert.equal(location.searchParams.get("next"), "/admin/mensajes");
  });

  it("permite /admin con cookie ah_session presente", () => {
    const res = proxy(makeRequest("/admin/pages", `${SESSION_COOKIE}=sess-test`));
    assert.equal(res.status, 200);
  });

  it("no exige sesión en rutas públicas del portal del Espacio", () => {
    const tenantOrigin = "http://seminario-ipn.localhost:3000";
    for (const path of ["/", "/programas", "/admision", "/formularios", "/contacto"]) {
      const res = proxy(makeRequest(path, undefined, tenantOrigin));
      assert.equal(res.status, 200, path);
    }
  });

  it("localhost muestra la portada y no las rutas del Espacio", () => {
    const home = proxy(makeRequest("/"));
    assert.equal(home.status, 200);
    const programas = proxy(makeRequest("/programas"));
    assert.equal(programas.status, 307);
    assert.equal(new URL(programas.headers.get("location")!).pathname, "/");
  });

  it("marca focused en /formularios/[id] del Espacio sin redirigir a login", () => {
    const res = proxy(
      makeRequest(
        "/formularios/convocatoria-talca-aurora-jul-2026",
        undefined,
        "http://seminario-ipn.localhost:3000"
      )
    );
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

  it("el origen de plataforma sirve la portada y aparta las rutas de Espacio", () => {
    withPlatformEnv(() => {
      const home = proxy(makeRequest("/", undefined, platformOrigin));
      assert.equal(home.status, 200);
      const programas = proxy(makeRequest("/programas", undefined, platformOrigin));
      assert.equal(programas.status, 307);
      assert.equal(new URL(programas.headers.get("location")!).pathname, "/");
    });
  });

  it("el subdominio de un Espacio sirve su sitio y formularios; el apex no", () => {
    withPlatformEnv(() => {
      const spaceOrigin = "https://mentor-prime-capacitacion.mentorprime.cl";
      for (const path of ["/", "/formularios/solicita-informacion"]) {
        const res = proxy(makeRequest(path, undefined, spaceOrigin));
        assert.equal(res.status, 200, path);
      }
      const apexForm = proxy(
        makeRequest("/formularios/solicita-informacion", undefined, platformOrigin)
      );
      assert.equal(apexForm.status, 307);
      assert.equal(new URL(apexForm.headers.get("location")!).pathname, "/");
    });
  });
});
