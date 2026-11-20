import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeDeleteBlockReason } from "../../src/core/congress/home-delete";
import { lodgingContactPhoneForSave } from "../../src/core/congress/lodging";

describe("eliminar hogar", () => {
  it("permite borrar un hogar sin camas activas", () => {
    assert.equal(
      homeDeleteBlockReason({
        homeId: "h1",
        assignments: [{ homeId: "h1", status: "cancelled" }],
      }),
      null
    );
  });

  it("bloquea si hay un hermano asignado o confirmado", () => {
    assert.match(
      homeDeleteBlockReason({
        homeId: "h1",
        assignments: [{ homeId: "h1", status: "assigned" }],
      }) ?? "",
      /hermanos asignados/
    );
    assert.match(
      homeDeleteBlockReason({
        homeId: "h1",
        assignments: [{ homeId: "h1", status: "confirmed" }],
      }) ?? "",
      /hermanos asignados/
    );
  });

  it("ignora camas de otro hogar", () => {
    assert.equal(
      homeDeleteBlockReason({
        homeId: "h1",
        assignments: [{ homeId: "h2", status: "confirmed" }],
      }),
      null
    );
  });
});

describe("teléfono del hogar", () => {
  it("deja vacío un teléfono opcional", () => {
    assert.deepEqual(lodgingContactPhoneForSave("  "), { ok: true, phone: null });
    assert.deepEqual(lodgingContactPhoneForSave(null), { ok: true, phone: null });
  });

  it("guarda el móvil chileno con +56", () => {
    assert.deepEqual(lodgingContactPhoneForSave("9 8765 4321"), {
      ok: true,
      phone: "+56 9 8765 4321",
    });
  });

  it("rechaza un número que no es chileno", () => {
    const result = lodgingContactPhoneForSave("123");
    assert.equal(result.ok, false);
  });
});
