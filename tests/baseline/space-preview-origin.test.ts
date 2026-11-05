import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpacePreviewOrigin } from "../../src/core/tenant/hosts";

const LOCAL_ENV = {
  APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  SPACE_BASE_DOMAIN: "mentorprime.cl",
};

const PUBLIC_ENV = {
  APP_URL: "https://growthos.mentorprime.cl",
  NEXT_PUBLIC_APP_URL: "https://growthos.mentorprime.cl",
  SPACE_BASE_DOMAIN: "mentorprime.cl",
};

describe("resolveSpacePreviewOrigin", () => {
  it("en localhost abre el Espacio local aunque el dominio principal sea público", () => {
    assert.equal(
      resolveSpacePreviewOrigin({
        slug: "seminario-ipn",
        primaryHost: "seminario-ipn.mentorprime.cl",
        requestHost: "localhost:3000",
        env: LOCAL_ENV,
      }),
      "http://seminario-ipn.localhost:3000"
    );
  });

  it("conserva el puerto del admin local", () => {
    assert.equal(
      resolveSpacePreviewOrigin({
        slug: "seminario-ipn",
        primaryHost: "seminario-ipn.mentorprime.cl",
        requestHost: "localhost:3001",
        env: LOCAL_ENV,
      }),
      "http://seminario-ipn.localhost:3001"
    );
  });

  it("en el sistema público abre el dominio principal del Espacio", () => {
    assert.equal(
      resolveSpacePreviewOrigin({
        slug: "seminario-ipn",
        primaryHost: "seminario-ipn.mentorprime.cl",
        requestHost: "growthos.mentorprime.cl",
        env: PUBLIC_ENV,
      }),
      "https://seminario-ipn.mentorprime.cl"
    );
  });

  it("en el sistema público respeta un dominio propio", () => {
    assert.equal(
      resolveSpacePreviewOrigin({
        slug: "seminario-ipn",
        primaryHost: "seminarioipn.cl",
        requestHost: "growthos.mentorprime.cl",
        env: PUBLIC_ENV,
      }),
      "https://seminarioipn.cl"
    );
  });
});
