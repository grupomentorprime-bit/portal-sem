import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveCumpleSeo } from "../../src/sites/cumple/seo";
import { CUMPLE_SEO } from "../../src/sites/cumple/site";

describe("SEO Cumple por ruta", () => {
  it("la home usa CUMPLE_SEO", () => {
    assert.deepEqual(resolveCumpleSeo("/"), CUMPLE_SEO);
  });

  it("cada materia tiene title y description propios", () => {
    const ley = resolveCumpleSeo("/materias/ley-karin");
    assert.notEqual(ley.title, CUMPLE_SEO.title);
    assert.ok(ley.description.length > 40);
    assert.match(ley.title, /Karin/i);
  });

  it("metadata Cumple resuelve SEO por x-pathname", () => {
    const source = readFileSync("src/lib/cms/metadata.ts", "utf8");
    assert.match(source, /resolveCumpleSeo/);
    assert.match(source, /x-pathname/);
  });
});
