import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import {
  CMS_CONTENT_PATHS,
  PUBLIC_PRODUCT_PATHS,
  asRecord,
  resolveSmokeBaseUrl,
  smokeFetch,
} from "./helpers";

let baseUrl: string | null = null;

async function ensureBase(): Promise<void> {
  baseUrl = await resolveSmokeBaseUrl();
}

function skipIfOffline(t: { skip: (msg?: string) => void }): boolean {
  if (baseUrl) return false;
  t.skip(
    "Sin app viva (SMOKE_BASE_URL / localhost:3000|3001). Contrato congelado en tests/baseline."
  );
  return true;
}

describe("OT-GROWTH-TEST-002 — portal público + CMS render", () => {
  before(ensureBase);

  it("home abre con branding institucional SEM", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/");
    assert.equal(res.status, 200);
    assert.match(res.text, /Seminario Eclesi/i);
    assert.match(res.text, /--brand-primary/);
    assert.match(res.text, /portal-header-premium/);
  });

  it("rutas de producto SEM responden 200", async (t) => {
    if (skipIfOffline(t)) return;
    for (const path of PUBLIC_PRODUCT_PATHS) {
      const res = await smokeFetch(path);
      assert.equal(res.status, 200, path);
    }
  });

  it("home expone navegación institucional SEM", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/");
    assert.equal(res.status, 200);
    // Contrato actual del menú CMS (no inventar links ausentes).
    for (const href of ["/", "/programas", "/equipo", "/contacto"]) {
      assert.match(res.text, new RegExp(`href="${href}"`), `faltanav ${href}`);
    }
    assert.match(res.text, /href="\/ingresar"/);
  });

  it("contenido CMS catch-all: 200 si publicado, 404 si ausente (sin mutar)", async (t) => {
    if (skipIfOffline(t)) return;
    for (const path of CMS_CONTENT_PATHS) {
      const res = await smokeFetch(path);
      assert.ok(
        res.status === 200 || res.status === 404,
        `${path} debe ser 200 (publicado) o 404 (sin página); got ${res.status}`
      );
    }
  });
});

describe("OT-GROWTH-TEST-002 — admin anónimo + login institucional (inicio)", () => {
  before(ensureBase);

  it("/admin sin sesión redirige a /admin/login", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/admin");
    assert.equal(res.status, 307);
    const loc = res.headers.get("location") ?? "";
    assert.match(loc, /\/admin\/login/);
    assert.match(loc, /next=/);
  });

  it("/admin/login responde 200 con shell de acceso", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/admin/login");
    assert.equal(res.status, 200);
    assert.match(res.text, /Growth OS/i);
    assert.match(res.text, /Acceso/i);
    assert.doesNotMatch(res.text, /CMS del SEM/i);
    assert.doesNotMatch(res.text, /Portal SEM/i);
  });

  it("providers públicos reportan Keycloak institucional", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/api/identity/auth/providers");
    assert.equal(res.status, 200);
    const body = asRecord(res.json);
    assert.equal(body?.ok, true);
    const providers = asRecord(body?.providers);
    assert.equal(providers?.institutional, true);
    assert.equal(providers?.institutionalOnly, true);
    assert.equal(providers?.local, false);
  });

  it("login Keycloak inicia redirect OAuth con PKCE (sin completar credenciales)", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/api/identity/auth/keycloak/login");
    if (res.status === 503) {
      const body = asRecord(res.json);
      assert.equal(body?.ok, false);
      t.diagnostic(
        "Límite: KEYCLOAK_* no habilita IdP; contrato detenido en providers + página login."
      );
      return;
    }
    assert.equal(res.status, 307);
    const loc = res.headers.get("location") ?? "";
    assert.match(loc, /openid-connect\/auth|protocol\/openid-connect/);
    assert.match(loc, /client_id=/);
    assert.match(loc, /redirect_uri=/);
    assert.match(loc, /code_challenge=/);
    assert.match(loc, /code_challenge_method=S256/);
    assert.match(loc, /state=/);
  });

  it("sesión Keycloak rechaza credenciales inválidas en el servidor (no redirige al IdP)", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/api/identity/auth/keycloak/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@y.z", password: "nope" }),
    });
    assert.notEqual(res.status, 410);
    assert.ok([400, 401, 502, 503].includes(res.status), `status inesperado ${res.status}`);
    const body = asRecord(res.json);
    assert.equal(body?.ok, false);
  });
});

describe("OT-GROWTH-TEST-002 — contratos API públicas/privadas", () => {
  before(ensureBase);

  it("formulario público Talca Aurora carga por API", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch(
      "/api/experience/forms/convocatoria-talca-aurora-jul-2026/public"
    );
    assert.equal(res.status, 200);
    const body = asRecord(res.json);
    assert.equal(body?.ok, true);
    const form = asRecord(body?.form);
    assert.equal(form?._id, "convocatoria-talca-aurora-jul-2026");
    assert.equal(form?.tenant, "seminario-ipn");
  });

  it("formulario inexistente responde 404", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/api/experience/forms/does-not-exist-xyz/public");
    assert.equal(res.status, 404);
    const body = asRecord(res.json);
    assert.equal(body?.ok, false);
  });

  it("APIs privadas anónimas responden 401", async (t) => {
    if (skipIfOffline(t)) return;
    const privatePaths = [
      "/api/cms/config",
      "/api/cms/pages",
      "/api/identity/me",
      "/api/identity/team",
      "/api/workflows/definitions",
      "/api/admin/integrations/storage",
    ];
    for (const path of privatePaths) {
      const res = await smokeFetch(path);
      assert.equal(res.status, 401, path);
      const body = asRecord(res.json);
      assert.equal(body?.ok, false, path);
    }
  });
});

describe("OT-GROWTH-TEST-002 — validación sin mutar datos reales", () => {
  before(ensureBase);

  it("admisión rechaza payload vacío con 422 (no escribe interesado)", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/api/admission/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "" }),
    });
    assert.equal(res.status, 422);
    const body = asRecord(res.json);
    assert.equal(body?.ok, false);
    const errors = asRecord(body?.errors);
    assert.ok(errors?.firstName);
    assert.ok(errors?.email);
    assert.ok(errors?.programId);
  });

  it("convocatoria rechaza registro vacío con 422 (no escribe submission/roster)", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch(
      "/api/experience/forms/convocatoria-talca-aurora-jul-2026/submit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {} }),
      }
    );
    assert.equal(res.status, 422);
    const body = asRecord(res.json);
    assert.equal(body?.ok, false);
    const errors = asRecord(body?.errors);
    assert.ok(errors?.fullName);
  });

  it("página del formulario público renderiza (HTML)", async (t) => {
    if (skipIfOffline(t)) return;
    const res = await smokeFetch("/formularios/convocatoria-talca-aurora-jul-2026");
    assert.equal(res.status, 200);
    assert.match(res.text, /convocatoria|Talca|Aurora|formulario/i);
  });
});
