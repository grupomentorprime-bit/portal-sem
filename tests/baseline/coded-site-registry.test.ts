import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { clearCodedSites, getCodedSite, registerCodedSite } from "../../src/sites/registry";

describe("coded site registry", () => {
  afterEach(() => {
    clearCodedSites();
  });

  it("empieza vacío y solo devuelve el sitio registrado", () => {
    assert.equal(getCodedSite("sem"), undefined);
    registerCodedSite({
      tenantId: "fixture",
      pages: [{ path: "/", title: "Inicio", navLabel: "Inicio" }],
      forms: [],
    });
    assert.equal(getCodedSite("sem"), undefined);
    assert.equal(getCodedSite("fixture")?.pages[0]?.title, "Inicio");
  });
});
