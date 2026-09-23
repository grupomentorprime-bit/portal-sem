/**
 * El callback OAuth no puede usar el bind interno de Next
 * (`https://localhost:3000` = hostname + x-forwarded-proto).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
import {
  PRODUCTION_CANONICAL_ORIGIN,
  publicRedirectUrl,
  resolveKeycloakRedirectUri,
  resolvePublicAppOrigin,
} from "../../src/core/identity/auth/public-origin";
import { readRequestCookie } from "../../src/core/identity/auth/oauth-cookies";

function requestTo(url: string, headers?: Record<string, string>): Request {
  return new Request(url, { headers });
}

describe("OAuth — origen público del callback", () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    KEYCLOAK_REDIRECT_URI: process.env.KEYCLOAK_REDIRECT_URI,
  };

  function restore() {
    for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  }

  it("un request ya público conserva su origen", () => {
    const origin = resolvePublicAppOrigin(
      requestTo("https://growthos.mentorprime.cl/api/identity/auth/keycloak/callback")
    );
    assert.equal(origin, "https://growthos.mentorprime.cl");
  });

  it("https://localhost:3000 usa el host reenviado", () => {
    const origin = resolvePublicAppOrigin(
      requestTo("https://localhost:3000/api/identity/auth/keycloak/callback?code=1", {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "growthos.mentorprime.cl",
        host: "localhost:3000",
      })
    );
    assert.equal(origin, "https://growthos.mentorprime.cl");
    const location = publicRedirectUrl(
      requestTo("https://localhost:3000/api/identity/auth/keycloak/callback", {
        host: "growthos.mentorprime.cl",
        "x-forwarded-proto": "https",
      }),
      "/admin"
    );
    assert.equal(location.href, "https://growthos.mentorprime.cl/admin");
  });

  it("en producción, sin host público, el origen canónico no es localhost", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://localhost:3000";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    try {
      const origin = resolvePublicAppOrigin(
        requestTo("https://localhost:3000/admin/login?error=oauth_state", {
          host: "localhost:3000",
        })
      );
      assert.equal(origin, PRODUCTION_CANONICAL_ORIGIN);
      const location = publicRedirectUrl(
        requestTo("https://localhost:3000/api/identity/auth/keycloak/callback", {
          host: "localhost:3000",
        }),
        "/admin/login?error=oauth_state"
      );
      assert.equal(
        location.href,
        "https://growthos.mentorprime.cl/admin/login?error=oauth_state"
      );
    } finally {
      restore();
    }
  });

  it("redirect_uri loopback de Keycloak se reescribe en producción", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://localhost:3000";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.KEYCLOAK_REDIRECT_URI =
      "https://localhost:3000/api/identity/auth/keycloak/callback";
    try {
      assert.equal(
        resolveKeycloakRedirectUri("https://localhost:3000"),
        "https://growthos.mentorprime.cl/api/identity/auth/keycloak/callback"
      );
    } finally {
      restore();
    }
  });

  it("en local el loopback se conserva", () => {
    process.env.NODE_ENV = "test";
    process.env.APP_URL = "http://localhost:3000";
    delete process.env.KEYCLOAK_REDIRECT_URI;
    try {
      const origin = resolvePublicAppOrigin(
        requestTo("http://localhost:3000/admin", { host: "localhost:3000" })
      );
      assert.equal(origin, "http://localhost:3000");
      assert.equal(
        resolveKeycloakRedirectUri("http://localhost:3000"),
        "http://localhost:3000/api/identity/auth/keycloak/callback"
      );
    } finally {
      restore();
    }
  });

  it("el gate de /admin en producción no redirige a localhost", () => {
    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://localhost:3000";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    try {
      const req = new NextRequest(new URL("https://localhost:3000/admin"), {
        headers: {
          host: "localhost:3000",
          "x-forwarded-host": "growthos.mentorprime.cl",
          "x-forwarded-proto": "https",
        },
      });
      const res = proxy(req);
      assert.equal(res.status, 307);
      const location = new URL(res.headers.get("location")!);
      assert.equal(location.origin, "https://growthos.mentorprime.cl");
      assert.equal(location.pathname, "/admin/login");
      assert.equal(location.searchParams.get("next"), "/admin");
    } finally {
      restore();
    }
  });

  it("la cookie de state se lee del header de la petición", () => {
    assert.equal(
      readRequestCookie("kc_oauth_state=abc%3D; kc_oauth_pkce=ver", "kc_oauth_state"),
      "abc="
    );
    assert.equal(readRequestCookie(null, "kc_oauth_state"), null);
  });
});
