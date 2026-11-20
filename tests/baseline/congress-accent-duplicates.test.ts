import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findFoldedNameDuplicates } from "../../src/core/congress/accent-duplicates";
import { registrationDeleteBlockReason } from "../../src/core/congress/registration-delete";

function row(id: string, fullName: string) {
  return { _id: id, identity: { fullName }, churchName: "IPN Ñuble" };
}

describe("duplicados por acento", () => {
  it("avisa cuando el mismo nombre está con y sin acento", () => {
    const matches = findFoldedNameDuplicates("Jose Perez", [
      row("a", "Hno José Pérez"),
      row("b", "Hno Ana Soto"),
    ]);
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.row._id, "a");
    assert.equal(matches[0]?.accentOnly, true);
  });

  it("no marca un solo nombre de pila", () => {
    const matches = findFoldedNameDuplicates("José", [
      row("a", "Jose"),
      row("b", "José Pérez"),
    ]);
    assert.deepEqual(matches, []);
  });

  it("no se compara consigo misma", () => {
    const matches = findFoldedNameDuplicates(
      "José Pérez",
      [row("a", "José Pérez"), row("b", "Jose Perez")],
      "a"
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.row._id, "b");
  });
});

describe("eliminar inscrito", () => {
  it("permite borrar una ficha sin aporte ni cama", () => {
    assert.equal(
      registrationDeleteBlockReason({
        registrationId: "a",
        allocatedPaidClp: 0,
        payments: [],
        assignments: [],
      }),
      null
    );
  });

  it("bloquea si hay aporte o cama activa", () => {
    assert.match(
      registrationDeleteBlockReason({
        registrationId: "a",
        allocatedPaidClp: 17000,
        payments: [],
        assignments: [],
      }) ?? "",
      /aporte/
    );
    assert.match(
      registrationDeleteBlockReason({
        registrationId: "a",
        allocatedPaidClp: 0,
        payments: [],
        assignments: [{ registrationId: "a", status: "confirmed" }],
      }) ?? "",
      /cama/
    );
  });

  it("ignora un pago anulado y una cama cancelada", () => {
    assert.equal(
      registrationDeleteBlockReason({
        registrationId: "a",
        allocatedPaidClp: 0,
        payments: [
          {
            status: "voided",
            allocations: [{ registrationId: "a", amountClp: 17000 }],
          },
        ],
        assignments: [{ registrationId: "a", status: "cancelled" }],
      }),
      null
    );
  });
});
