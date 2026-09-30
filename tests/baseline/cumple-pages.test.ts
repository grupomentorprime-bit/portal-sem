import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { describe, it } from "node:test";
import { getMateria, materias } from "../../src/sites/cumple/pages/materias";
import { fichas } from "../../src/sites/cumple/norma";
import { getCodedPageView } from "../../src/sites/page-views";
import { resolveCumpleSeo } from "../../src/sites/cumple/seo";
import { CUMPLE_SEO, CUMPLE_TENANT_ID, cumpleSite } from "../../src/sites/cumple/site";

/** `next/font/google` solo existe dentro del compilador de Next; fuera se sustituye por un stub. */
function stubNextFonts(): void {
  const loader = Module as unknown as {
    _load: (request: string, ...rest: unknown[]) => unknown;
  };
  const original = loader._load;
  loader._load = function patched(request: string, ...rest: unknown[]) {
    if (request === "next/font/google") {
      return new Proxy({}, { get: () => () => ({ className: "", variable: "", style: {} }) });
    }
    return original.call(this, request, ...rest);
  };
}

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

  it("cada cita inline tiene su frase ancla en un párrafo de la sección", () => {
    let total = 0;
    for (const materia of materias) {
      let citasMateria = 0;
      for (const section of [materia.exige, materia.implica, materia.cumple]) {
        for (const citation of section.citations ?? []) {
          citasMateria += 1;
          assert.ok(citation.anchor.length > 0, `${materia.slug}: ancla vacía`);
          assert.ok(
            section.paragraphs.some((p) => p.includes(citation.anchor)),
            `${materia.slug}: ancla "${citation.anchor}" no aparece en los párrafos`,
          );
        }
      }
      assert.ok(citasMateria >= 1, materia.slug);
      total += citasMateria;
    }
    assert.ok(total >= materias.length);
  });

  it("cada materia enlaza a cómo funciona, preguntas frecuentes y evaluar", () => {
    for (const materia of materias) {
      for (const required of ["/como-funciona", "/preguntas-frecuentes", "/evaluar"]) {
        assert.ok(materia.relatedPaths.includes(required), `${materia.slug}: falta ${required}`);
      }
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

describe("Plantilla de materias Cumple", () => {
  it("registra vistas de las seis materias en el registro de páginas codificadas", async () => {
    stubNextFonts();
    const { registerProductionPageViews } = await import("../../src/sites/production-views");
    registerProductionPageViews();
    assert.equal(materias.length, 6);
    for (const materia of materias) {
      assert.equal(
        typeof getCodedPageView(CUMPLE_TENANT_ID, materia.path),
        "function",
        `sin vista registrada: ${materia.path}`,
      );
    }
    assert.equal(typeof getCodedPageView(CUMPLE_TENANT_ID, "/"), "function");
    assert.equal(getCodedPageView(CUMPLE_TENANT_ID, "/materias/no-existe"), undefined);
  });

  it("MateriaPage enlaza citas inline y conserva bloque de fuentes y relacionados", () => {
    const materiaPage = readFileSync("src/components/sites/cumple/MateriaPage.tsx", "utf8");
    assert.match(materiaPage, /SourcesBlock/);
    assert.match(materiaPage, /citation\.anchor/);
    assert.match(materiaPage, /relatedPaths/);
    assert.match(materiaPage, /\/evaluar/);
    assert.match(materiaPage, /disclaimer/);
  });

  it("la home usa el shell compartido y el pie lee el contacto", () => {
    const home = readFileSync("src/components/sites/cumple/CumpleHome.tsx", "utf8");
    const shell = readFileSync("src/components/sites/cumple/CumpleShell.tsx", "utf8");
    const footer = readFileSync("src/components/sites/cumple/CumpleFooter.tsx", "utf8");
    assert.match(home, /CumpleShell/);
    assert.match(shell, /CumpleFooter/);
    assert.match(shell, /AsesorChat/);
    assert.match(footer, /contact\.email/);
    assert.match(footer, /\/materias\/ley-karin/);
  });
});