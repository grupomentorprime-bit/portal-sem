/**
 * OT-GROWTH-AUTH-HARDENING-001 — Auth Code + PKCE como login primario.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-AUTH-HARDENING-001 — login UI Auth Code + PKCE", () => {
  it("LoginForm pide usuario y contraseña y los valida en el servidor", () => {
    const form = readSrc("src/components/identity/LoginForm.tsx");
    const page = readSrc("src/app/login/page.tsx");
    assert.match(form, /Usuario/);
    assert.match(form, /Contraseña/);
    assert.match(form, /type="password"/);
    assert.match(form, /\/api\/identity\/auth\/keycloak\/session/);
    assert.doesNotMatch(form, /href=\{loginHref\}/);
    assert.doesNotMatch(form, /\/api\/identity\/auth\/keycloak\/login/);
    assert.doesNotMatch(page, /\/api\/identity\/auth\/keycloak\/login/);
    assert.doesNotMatch(page, /grant/);
  });

  it("endpoint de sesión valida credenciales con Keycloak en el servidor", () => {
    const session = readSrc("src/app/api/identity/auth/keycloak/session/route.ts");
    assert.match(session, /from\s+"@\/core\/identity\/auth\/keycloak"/);
    assert.match(session, /await\s+loginWithKeycloakPassword/);
    assert.doesNotMatch(session, /auth_code_required/);
    assert.doesNotMatch(session, /status:\s*410/);
  });

  it("login page redirige la sesión con el destino post-auth", () => {
    const page = readSrc("src/app/login/page.tsx");
    const legacy = readSrc("src/app/admin/login/page.tsx");
    assert.match(page, /loadSessionContext/);
    assert.match(page, /resolvePostAuthDestination/);
    assert.match(page, /hasPlatformOperatorCapability/);
    assert.doesNotMatch(page, /redirect\("\/admin"\)/);
    assert.match(page, /LoginForm/);
    assert.doesNotMatch(page, /\/api\/identity\/auth\/keycloak\/login/);
    assert.match(legacy, /toGrowthLoginPath/);
    assert.doesNotMatch(legacy, /LoginForm/);
    assert.doesNotMatch(legacy, /type=\"password\"/);
  });
});

describe("OT-GROWTH-AUTH-HARDENING-001 — PKCE S256 + state", () => {
  it("login route genera state + code_verifier httpOnly y authorize con challenge", () => {
    const login = readSrc("src/app/api/identity/auth/keycloak/login/route.ts");
    assert.match(login, /createPkcePair/);
    assert.match(login, /PKCE_COOKIE/);
    assert.match(login, /STATE_COOKIE/);
    assert.match(login, /httpOnly:\s*true/);
    assert.match(login, /buildKeycloakAuthorizeUrl\(state,\s*codeChallenge\)/);
  });

  it("callback valida state y exige code_verifier; lo consume de un solo uso", () => {
    const cb = readSrc("src/app/api/identity/auth/keycloak/callback/route.ts");
    assert.match(cb, /state !== savedState/);
    assert.match(cb, /oauth_pkce/);
    assert.match(cb, /exchangeKeycloakCode\(code,\s*codeVerifier\)/);
    assert.match(cb, /readRequestCookie\(cookieHeader,\s*STATE_COOKIE\)/);
    assert.match(cb, /response\.cookies\.set\(STATE_COOKIE/);
    assert.match(cb, /response\.cookies\.set\(PKCE_COOKIE/);
    assert.match(cb, /publicRedirectUrl\(request,/);
    assert.doesNotMatch(cb, /new URL\([^,]+,\s*request\.url\)/);
  });

  it("keycloak.ts emite code_challenge_method=S256 y manda code_verifier al token", () => {
    const src = readSrc("src/core/identity/auth/keycloak.ts");
    assert.match(src, /code_challenge_method:\s*"S256"/);
    assert.match(src, /code_verifier:\s*codeVerifier/);
    assert.match(src, /createPkcePair/);
  });

  it("createPkcePair produce verifier aleatorio y challenge S256", async () => {
    const { createPkcePair } = await import("../../src/core/identity/auth/keycloak");
    const a = createPkcePair();
    const b = createPkcePair();
    assert.notEqual(a.codeVerifier, b.codeVerifier);
    assert.equal(
      createHash("sha256").update(a.codeVerifier).digest("base64url"),
      a.codeChallenge
    );
    assert.match(a.codeVerifier, /^[A-Za-z0-9_-]+$/);
    assert.ok(a.codeVerifier.length >= 43);
  });
});

describe("OT-GROWTH-AUTH-HARDENING-001 — cookie de sesión en localhost", () => {
  it("https://localhost no marca Secure si el navegador no llegó por https", async () => {
    const { isSecureCookieFromHeaders } = await import("../../src/core/identity/auth/config");
    const prev = {
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE,
    };
    delete process.env.SESSION_COOKIE_SECURE;
    try {
      process.env.APP_URL = "https://localhost:3000";
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      assert.equal(isSecureCookieFromHeaders(new Headers()), false);
      assert.equal(
        isSecureCookieFromHeaders(new Headers({ "x-forwarded-proto": "https" })),
        true
      );

      process.env.APP_URL = "https://growthos.mentorprime.cl";
      assert.equal(isSecureCookieFromHeaders(new Headers()), true);
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe("OT-GROWTH-AUTH-HARDENING-001 — cliente growth-os-web", () => {
  it("local usa growth-os-dev y producción sigue en growth-os-web", () => {
    const keycloak = readSrc("src/core/identity/auth/keycloak.ts");
    assert.match(keycloak, /GROWTH_OS_KEYCLOAK_CLIENT_ID\s*=\s*"growth-os-web"/);
    assert.match(keycloak, /GROWTH_OS_DEV_KEYCLOAK_CLIENT_ID\s*=\s*"growth-os-dev"/);
    assert.match(keycloak, /admin-cli/);
    assert.match(keycloak, /seminario-ipn-web/);
    assert.match(keycloak, /BLOCKED_GROWTH_OS_CLIENT_IDS/);
    assert.match(keycloak, /FORBIDDEN_PRODUCTION_CLIENT_IDS/);
    assert.match(keycloak, /KEYCLOAK_CLIENT_SECRET es obligatorio en producción/);

    const envExample = readSrc(".env.example");
    assert.match(envExample, /KEYCLOAK_CLIENT_ID=growth-os-dev/);
    assert.match(envExample, /KEYCLOAK_CLIENT_ID=growth-os-web/);
    assert.doesNotMatch(envExample, /KEYCLOAK_CLIENT_ID=admin-cli/);
    assert.doesNotMatch(envExample, /KEYCLOAK_CLIENT_ID=seminario-ipn-web/);

    const setup = readSrc("scripts/setup-keycloak-client.ts");
    assert.match(setup, /DEV_CLIENT_ID = "growth-os-dev"/);
    assert.match(setup, /growth-os-web/);
    assert.match(setup, /seminario-ipn-web/);
    assert.match(setup, /directAccessGrantsEnabled:\s*true/);
    assert.match(setup, /no se actualiza ni se regenera el secret/);
    assert.match(setup, /seminario-ipn-web y admin-cli no se tocan/);
  });

  it("getKeycloakConfig rechaza admin-cli / seminario-ipn-web en producción", async () => {
    const { getKeycloakConfig } = await import("../../src/core/identity/auth/keycloak");
    const prev = {
      NODE_ENV: process.env.NODE_ENV,
      KEYCLOAK_URL: process.env.KEYCLOAK_URL,
      KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
      KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
      KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
    };

    process.env.NODE_ENV = "production";
    process.env.KEYCLOAK_URL = "https://auth.example.test";
    process.env.KEYCLOAK_REALM = "seminario-ipn";
    process.env.KEYCLOAK_CLIENT_SECRET = "secret-test-value";

    try {
      process.env.KEYCLOAK_CLIENT_ID = "admin-cli";
      assert.equal(getKeycloakConfig(), null);

      process.env.KEYCLOAK_CLIENT_ID = "seminario-ipn-web";
      assert.equal(getKeycloakConfig(), null);

      process.env.KEYCLOAK_CLIENT_ID = "growth-os-dev";
      assert.equal(getKeycloakConfig(), null);

      process.env.KEYCLOAK_CLIENT_ID = "growth-os-web";
      const cfg = getKeycloakConfig();
      assert.ok(cfg);
      assert.equal(cfg!.clientId, "growth-os-web");
      assert.equal(cfg!.publicClient, false);

      delete process.env.KEYCLOAK_CLIENT_SECRET;
      assert.equal(getKeycloakConfig(), null);
      process.env.KEYCLOAK_CLIENT_SECRET = "secret-test-value";

      process.env.NODE_ENV = "development";
      process.env.KEYCLOAK_CLIENT_ID = "seminario-ipn-web";
      assert.equal(getKeycloakConfig(), null);

      process.env.KEYCLOAK_CLIENT_ID = "growth-os-dev";
      const devCfg = getKeycloakConfig();
      assert.ok(devCfg);
      assert.equal(devCfg!.clientId, "growth-os-dev");
    } finally {
      process.env.NODE_ENV = prev.NODE_ENV;
      for (const key of [
        "KEYCLOAK_URL",
        "KEYCLOAK_REALM",
        "KEYCLOAK_CLIENT_ID",
        "KEYCLOAK_CLIENT_SECRET",
      ] as const) {
        if (prev[key] === undefined) delete process.env[key];
        else process.env[key] = prev[key];
      }
    }
  });
});

describe("OT-GROWTH-AUTH-HARDENING-001 — ROPC residual / invitaciones", () => {
  it("invitación Keycloak no usa ROPC; redirige a Auth Code", () => {
    const accept = readSrc("src/app/api/identity/invitations/[token]/accept/route.ts");
    assert.doesNotMatch(accept, /loginWithKeycloakPassword/);
    assert.match(accept, /redirectLogin:\s*true/);
    assert.match(accept, /Authorization Code \+ PKCE/);

    const inviteForm = readSrc("src/components/identity/AcceptInviteForm.tsx");
    assert.match(inviteForm, /\/login/);
    assert.doesNotMatch(inviteForm, /\/admin\/login/);
  });

  it("loginWithKeycloakPassword es el login embebido (servidor → IdP)", () => {
    const src = readSrc("src/core/identity/auth/keycloak.ts");
    assert.match(src, /loginWithKeycloakPassword/);
    assert.match(src, /ROPC/);
    assert.match(src, /login embebido de Growth OS/);
  });
});

describe("OT-GROWTH-AUTH-HARDENING-001 — sesión opaca preservada", () => {
  it("callback sigue creando sesión opaca (no JWT de app)", () => {
    const cb = readSrc("src/app/api/identity/auth/keycloak/callback/route.ts");
    assert.match(cb, /createSession/);
    assert.match(cb, /setSessionCookie/);
    assert.doesNotMatch(cb, /jwt|JWT|sign\(/);
  });
});
