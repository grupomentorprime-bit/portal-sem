import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveLoginDisplayName } from "../../src/lib/identity/login-display-name";
import { firstNameFromDisplayName } from "../../src/lib/platform/space-labels";

describe("nombre corto de la cuenta", () => {
  it("guarda el nombre de la invitación aunque Google traiga otro", () => {
    const saved = resolveLoginDisplayName({
      email: "msepulvedebustos@gmail.com",
      identityName: "masf dsd",
      invitationName: "Marco Sepúlveda Bustos",
      currentName: "masf dsd",
    });
    assert.equal(saved, "Marco Sepúlveda Bustos");
    assert.equal(firstNameFromDisplayName(saved), "Marco");
  });

  it("conserva un nombre ya editado en el perfil", () => {
    assert.equal(
      resolveLoginDisplayName({
        email: "ana@iglesia.cl",
        identityName: "Ana Google",
        invitationName: "",
        currentName: "Ana López",
      }),
      "Ana López"
    );
  });

  it("usa el perfil de identidad solo si nadie escribió un nombre", () => {
    assert.equal(
      resolveLoginDisplayName({
        email: "ana@iglesia.cl",
        identityName: "Ana Google",
        currentName: "",
      }),
      "Ana Google"
    );
  });
});
