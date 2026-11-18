import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accessPasswordCheck } from "../../src/lib/identity/access-password-check";

describe("consulta de contraseña al reenviar acceso", () => {
  it("usa la respuesta cuando Keycloak contesta a tiempo", async () => {
    const needsPassword = await accessPasswordCheck(Promise.resolve(true), 200);
    assert.equal(needsPassword, true);
  });

  it("mantiene el enlace de acceso si Keycloak confirma la contraseña", async () => {
    const needsPassword = await accessPasswordCheck(Promise.resolve(false), 200);
    assert.equal(needsPassword, false);
  });

  it("incluye el enlace para crear la contraseña si la consulta no responde", async () => {
    const needsPassword = await accessPasswordCheck(new Promise<boolean>(() => {}), 30);
    assert.equal(needsPassword, true);
  });

  it("incluye el enlace para crear la contraseña si la consulta falla", async () => {
    const needsPassword = await accessPasswordCheck(Promise.reject(new Error("red")), 200);
    assert.equal(needsPassword, true);
  });
});
