import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  foldCongressChurchBase,
  formatCongressChurchLabel,
  mergeCongressChurchOptions,
  sameCongressChurch,
} from "../../src/core/congress/church-name";

describe("congress church name", () => {
  it("fold trata ÑUBLE ALTO e IPN Ñuble alto como la misma base", () => {
    assert.equal(foldCongressChurchBase("ÑUBLE ALTO"), "nuble alto");
    assert.equal(foldCongressChurchBase("IPN Ñuble alto"), "nuble alto");
    assert.equal(foldCongressChurchBase("ipn  ñuble   alto"), "nuble alto");
  });

  it("sameCongressChurch ignora prefijo IPN y mayúsculas", () => {
    assert.equal(sameCongressChurch("ÑUBLE ALTO", "IPN Ñuble alto"), true);
    assert.equal(sameCongressChurch("HUAMBALI", "IPN HUAMBALI"), true);
    assert.equal(sameCongressChurch("HUAMBALI", "SAN CARLOS"), false);
  });

  it("formatCongressChurchLabel antepone IPN y deja todo en mayúsculas", () => {
    assert.equal(formatCongressChurchLabel("ÑUBLE ALTO"), "IPN ÑUBLE ALTO");
    assert.equal(formatCongressChurchLabel("IPN Ñuble alto"), "IPN ÑUBLE ALTO");
    assert.equal(formatCongressChurchLabel("ipn HUAMBALI"), "IPN HUAMBALI");
    assert.equal(formatCongressChurchLabel("5 de abril"), "IPN 5 DE ABRIL");
  });

  it("mergeCongressChurchOptions fusiona duplicados y etiqueta con IPN en mayúsculas", () => {
    const merged = mergeCongressChurchOptions([
      "5 DE ABRIL",
      "ÑUBLE ALTO",
      "IPN Ñuble alto",
      "HUAMBALI",
      "IPN HUAMBALI",
    ]);
    assert.deepEqual(
      merged.map((o) => o.label),
      ["IPN 5 DE ABRIL", "IPN HUAMBALI", "IPN ÑUBLE ALTO"]
    );
    assert.equal(merged.find((o) => o.baseKey === "nuble alto")?.label, "IPN ÑUBLE ALTO");
  });
});
