import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  nameForMemberAccessEmail,
  pickInvitationDisplayName,
  resolveLoginDisplayName,
} from "../../src/lib/identity/login-display-name";
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

  it("conserva el nombre corregido aunque el último reenvío copie a Google", () => {
    assert.equal(
      resolveLoginDisplayName({
        email: "msepulvedabustos@gmail.com",
        identityName: "masf dsd",
        invitationName: "masf dsd",
        currentName: "Marco Sepúlveda Bustos",
      }),
      "Marco Sepúlveda Bustos"
    );
  });

  it("ignora la copia de Google y usa el nombre escrito en la invitación", () => {
    assert.equal(
      pickInvitationDisplayName(
        ["masf dsd", "Marco Sepúlveda Bustos", "Marco Sepúlveda B."],
        "masf dsd"
      ),
      "Marco Sepúlveda Bustos"
    );
    assert.equal(pickInvitationDisplayName(["masf dsd"], "masf dsd"), "masf dsd");
  });

  it("el reenvío no vuelve a grabar el nombre de Google", () => {
    assert.equal(
      nameForMemberAccessEmail("masf dsd", ["masf dsd", "Marco Sepúlveda Bustos"]),
      "Marco Sepúlveda Bustos"
    );
    assert.equal(
      nameForMemberAccessEmail("masf dsd", ["Marco Sepúlveda Bustos"]),
      "Marco Sepúlveda Bustos"
    );
    assert.equal(
      nameForMemberAccessEmail("Marco Sepúlveda Bustos", [
        "masf dsd",
        "Marco Sepúlveda Bustos",
      ]),
      "Marco Sepúlveda Bustos"
    );
  });
});
