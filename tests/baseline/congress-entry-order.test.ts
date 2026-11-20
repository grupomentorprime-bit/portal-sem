import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareByRegistrationEntryNumber,
  compareRegistrationsForEntryBackfill,
  planCompactEntryNumbers,
  registrationEntryNumber,
  type EntryNumberRow,
} from "../../src/core/congress/entry-order";

function row(
  id: string,
  name: string,
  createdAt: string,
  entryNumber?: number | null
): EntryNumberRow {
  return {
    _id: id,
    createdAt,
    entryNumber: entryNumber ?? null,
    identity: {
      fullName: name,
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
    },
  };
}

describe("correlativo de ficha", () => {
  it("lee solo enteros positivos", () => {
    assert.equal(registrationEntryNumber({ entryNumber: 12 }), 12);
    assert.equal(registrationEntryNumber({ entryNumber: 0 }), null);
    assert.equal(registrationEntryNumber({ entryNumber: null }), null);
  });

  it("ordena el backfill por createdAt y luego nombre", () => {
    const rows = [
      row("c", "Carlos", "2026-11-18T12:00:00.000Z"),
      row("a", "Ana", "2026-11-18T10:00:00.000Z"),
      row("b", "Bruno", "2026-11-18T10:00:00.000Z"),
    ];
    rows.sort(compareRegistrationsForEntryBackfill);
    assert.deepEqual(
      rows.map((r) => r._id),
      ["a", "b", "c"]
    );
  });

  it("lista con el correlativo más alto arriba y sin número al final", () => {
    const rows = [
      row("z", "Zeta", "2026-11-18T09:00:00.000Z"),
      row("b", "Bruno", "2026-11-18T11:00:00.000Z", 2),
      row("a", "Ana", "2026-11-18T12:00:00.000Z", 1),
    ];
    rows.sort(compareByRegistrationEntryNumber);
    assert.deepEqual(
      rows.map((r) => r._id),
      ["b", "a", "z"]
    );
  });

  it("al borrar, cierra huecos y conserva el menor número", () => {
    const next = planCompactEntryNumbers([
      row("a", "Ana", "2026-11-18T10:00:00.000Z", 99),
      row("b", "Bruno", "2026-11-18T11:00:00.000Z", 101),
      row("c", "Carlos", "2026-11-18T12:00:00.000Z", 104),
    ]);
    assert.deepEqual(next, [
      { _id: "a", entryNumber: 99 },
      { _id: "b", entryNumber: 100 },
      { _id: "c", entryNumber: 101 },
    ]);
  });
});
