import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listManifests } from "../../src/nelzuri";

describe("registro de capacidades sin orden de importación", () => {
  it("publica Admisión, Asuntos y Congreso antes de cargar reglas o efectos", () => {
    assert.deepEqual(
      listManifests()
        .filter((item) => item.class === "specialized")
        .map((item) => item.id),
      ["admision", "asuntos-estudiantiles", "congreso"]
    );
  });

  it("el instalador posterior agrega el efecto sin otra ficha", async () => {
    const before = listManifests().map((item) => item.id);
    const installed = await import("../../src/lib/desktop/register-specialized");
    installed.ensureSpecializedCapabilities();
    const { resolveFormEffect, listManifests: listed } = await import("../../src/nelzuri");
    assert.deepEqual(
      listed().map((item) => item.id),
      before
    );
    assert.equal(
      resolveFormEffect({ _id: "ipn-asistencia-congreso-varones-2026" }, "ipn-chile").status,
      "one"
    );
    assert.equal(
      resolveFormEffect({ _id: "cumple-diagnostico" }, "cumple").status,
      "one"
    );
  });
});
