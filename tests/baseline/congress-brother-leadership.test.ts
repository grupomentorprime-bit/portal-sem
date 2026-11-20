import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayBrotherName,
  ensureHnoPrefix,
  hasBrotherOrTitlePrefix,
} from "../../src/core/congress/brother-name";
import {
  churchLeadersToClear,
  zoneLeadersToClear,
} from "../../src/core/congress/leadership";

describe("brother-name", () => {
  it("quita Hno y conserva Pastor", () => {
    assert.equal(displayBrotherName("Marco Sepúlveda"), "Marco Sepúlveda");
    assert.equal(displayBrotherName("Hno Marco"), "Marco");
    assert.equal(displayBrotherName("Hermano Pedro Soto"), "Pedro Soto");
    assert.equal(displayBrotherName("Pastor Juan Pérez"), "Pastor Juan Pérez");
    assert.equal(hasBrotherOrTitlePrefix("Hno Ana"), true);
    assert.equal(hasBrotherOrTitlePrefix("Ana"), false);
    assert.equal(ensureHnoPrefix("Pedro"), "Pedro");
    assert.equal(ensureHnoPrefix("Hno Pedro"), "Pedro");
    assert.equal(ensureHnoPrefix("Pastor Juan"), "Pastor Juan");
  });
});

describe("leadership uniqueness", () => {
  it("limpia el líder previo de la misma iglesia/zona", () => {
    const cleared = churchLeadersToClear({
      next: { _id: "b", zoneId: "zona-7", churchName: "IPN Ñuble alto" },
      registrations: [
        {
          _id: "a",
          zoneId: "zona-7",
          churchName: "ÑUBLE ALTO",
          isChurchGroupLeader: true,
        },
        {
          _id: "b",
          zoneId: "zona-7",
          churchName: "IPN Ñuble alto",
          isChurchGroupLeader: false,
        },
        {
          _id: "c",
          zoneId: "zona-7",
          churchName: "Otra",
          isChurchGroupLeader: true,
        },
      ],
    });
    assert.deepEqual(cleared, ["a"]);
  });

  it("limpia el jefe zonal previo de la misma zona", () => {
    const cleared = zoneLeadersToClear({
      next: { _id: "b", zoneId: "zona-7" },
      registrations: [
        { _id: "a", zoneId: "zona-7", isZoneLeader: true },
        { _id: "b", zoneId: "zona-7", isZoneLeader: false },
        { _id: "c", zoneId: "zona-1", isZoneLeader: true },
      ],
    });
    assert.deepEqual(cleared, ["a"]);
  });
});
