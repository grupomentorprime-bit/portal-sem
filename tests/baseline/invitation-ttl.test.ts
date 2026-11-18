import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

describe("vigencia del enlace de invitación", () => {
  it("no caduca en menos de 12 horas", async () => {
    const { invitationTtlMinutes, INVITATION_TTL_MINUTES } = await import(
      "../../src/lib/identity/invitations"
    );
    assert.equal(INVITATION_TTL_MINUTES, 12 * 60);
    assert.equal(invitationTtlMinutes(), 12 * 60);
    assert.equal(invitationTtlMinutes(15), 12 * 60);
    assert.equal(invitationTtlMinutes(30), 12 * 60);
  });
});
