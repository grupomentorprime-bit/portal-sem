import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import type { EmailIdentity } from "../../src/lib/notifications/identity";
import { GROWTH_LOGIN_PATH } from "../../src/lib/identity/login-route";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

const identity: EmailIdentity = {
  tenantId: "seminario-ipn",
  siteId: "seminario-ipn",
  displayName: "Seminario IPN",
  origin: "https://seminario-ipn.example",
};

describe("invitation email login copy", () => {
  it("incluye CTA de crear clave y URL absoluta de login", async () => {
    const { renderInvitationEmail } = await import("../../src/lib/notifications/email");
    const { html } = renderInvitationEmail({
      identity,
      displayName: "María González",
      token: "tok-test-123",
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
    assert.match(html, /\/invite\/tok-test-123/);
    assert.match(html, /Crear mi contraseña/);
    assert.match(html, new RegExp(`${identity.origin}${GROWTH_LOGIN_PATH}`));
    assert.match(html, /Entra en/i);
    assert.doesNotMatch(html, /15 minutos/);
  });
});
