import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accessPasswordCheck } from "../../src/lib/identity/access-password-check";

describe("consulta de contraseña al reenviar acceso", () => {
  it("usa la respuesta cuando Keycloak contesta a tiempo", async () => {
    const needsPassword = await accessPasswordCheck(Promise.resolve(true), 200);
    assert.equal(needsPassword, true);
  });

  it("sigue con el enlace de acceso si la consulta no responde", async () => {
    const needsPassword = await accessPasswordCheck(new Promise<boolean>(() => {}), 30);
    assert.equal(needsPassword, false);
  });

  it("sigue con el enlace de acceso si la consulta falla", async () => {
    const needsPassword = await accessPasswordCheck(Promise.reject(new Error("red")), 200);
    assert.equal(needsPassword, false);
  });
});
