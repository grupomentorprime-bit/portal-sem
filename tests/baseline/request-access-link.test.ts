import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import {
  assertAccessRequestAllowed,
  __resetAccessRequestRateLimitForTests,
} from "../../src/lib/identity/access-request-rate-limit";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

describe("access request rate limit", () => {
  it("bloquea el segundo intento inmediato con la misma key", () => {
    __resetAccessRequestRateLimitForTests();
    assert.equal(assertAccessRequestAllowed("ip:1|a@b.cl").ok, true);
    const second = assertAccessRequestAllowed("ip:1|a@b.cl");
    assert.equal(second.ok, false);
    if (!second.ok) assert.ok(second.retryAfterSec >= 1);
  });
});

describe("requestAccessLink contract", () => {
  it("exporta mensaje genérico estable", async () => {
    const { ACCESS_LINK_GENERIC_MESSAGE } = await import(
      "../../src/lib/identity/request-access-link"
    );
    assert.match(ACCESS_LINK_GENERIC_MESSAGE, /Si el correo está registrado/);
  });
});
