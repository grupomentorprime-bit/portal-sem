import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getMateria, materias } from "../../src/sites/cumple/pages/materias";
import { fichas } from "../../src/sites/cumple/norma";
import { resolveCumpleSeo } from "../../src/sites/cumple/seo";
import { CUMPLE_SEO, cumpleSite } from "../../src/sites/cumple/site";

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

describe("Materias Cumple", () => {
  it("declara seis materias con fuentes oficiales https", () => {
    assert.equal(materias.length, 6);
    for (const materia of materias) {
      assert.ok(materia.sources.length >= 1);
      for (const source of materia.sources) {
        assert.match(source.url, /^https:\/\//);
        assert.ok(!source.url.includes("example.com"));
      }
      assert.match(materia.h1, /\S/);
      assert.ok(materia.exige.paragraphs.length >= 2);
      assert.ok(materia.implica.paragraphs.length >= 1);
      assert.ok(materia.cumple.paragraphs.length >= 1);
      assert.match(materia.disclaimer, /no sustituye asesoría legal formal/i);
      assert.ok(
        (materia.exige.citations?.length ?? 0) + (materia.implica.citations?.length ?? 0) >= 1,
      );
    }
    assert.equal(getMateria("ley-karin")?.path, "/materias/ley-karin");
  });

  it("las fuentes y citas reutilizan URLs de norma.ts", () => {
    const oficiales = new Set(fichas.flatMap((f) => (f.fuente ? [f.fuente.url] : [])));
    for (const materia of materias) {
      const urls = [
        ...materia.sources.map((s) => s.url),
        ...[materia.exige, materia.implica, materia.cumple].flatMap((s) => s.citations?.map((c) => c.url) ?? []),
      ];
      for (const url of urls) assert.ok(oficiales.has(url), `${materia.slug}: ${url}`);
    }
  });

  it("paths coinciden con el sitio y los relacionados existen", () => {
    const paths = new Set(cumpleSite.pages.map((page) => page.path));
    for (const materia of materias) {
      assert.equal(materia.path, `/materias/${materia.slug}`);
      assert.ok(materia.relatedPaths.length >= 1);
      assert.ok(!materia.relatedPaths.includes(materia.path));
      for (const related of materia.relatedPaths) {
        assert.ok(paths.has(related), related);
      }
    }
    assert.equal(getMateria("no-existe"), undefined);
  });
});

