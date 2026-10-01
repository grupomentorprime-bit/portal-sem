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

describe("Navegación Cumple", () => {
  it("el menú usa rutas reales y no anclas sueltas en paneles", async () => {
    const { menus, soluciones, informacion, recursos } = await import("../../src/sites/cumple/content");
    assert.equal(soluciones.length, 6);
    assert.equal(informacion.length, 6);
    for (const item of [...soluciones, ...informacion, ...recursos]) {
      assert.ok(item.href.startsWith("/"));
      assert.ok(!item.href.startsWith("/#"));
    }
    const inicio = menus.find((m) => m.id === "inicio");
    assert.ok(inicio && "href" in inicio && inicio.href === "/");
    const informacionMenu = menus.find((m) => m.id === "informacion");
    assert.ok(informacionMenu && "label" in informacionMenu && informacionMenu.label === "Información");
    assert.ok(!menus.some((m) => m.id === "normativas"));
    const nosotros = menus.find((m) => m.id === "nosotros");
    assert.ok(nosotros && "href" in nosotros && nosotros.href === "/nosotros");
    const contacto = menus.find((m) => m.id === "contacto");
    assert.ok(contacto && "href" in contacto && contacto.href === "/contacto");
    const header = readFileSync("src/components/sites/cumple/site-header.tsx", "utf8");
    assert.match(header, /href="\/evaluar"/);
    assert.doesNotMatch(header, /href="#evaluar"/);
  });
});

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
      assert.match(materia.titleName, /\S/);
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

  it("cada materia usa titleName institucional y eyebrow transversal", () => {
    assert.equal(materias.length, 6);
    for (const materia of materias) {
      assert.equal(materia.eyebrow, "Información · Cumplimiento");
      assert.match(materia.titleName, /\S/);
      assert.ok(!("h1" in materia), `${materia.slug}: no debe conservar h1`);
    }
    const ley = getMateria("ley-karin");
    assert.equal(ley?.titleName, "Ley Karin");
    assert.equal(ley?.normRef, "Ley 21.643");
  });

  it("Ley Karin incluye conceptos y checklist editorial", () => {
    const ley = getMateria("ley-karin");
    assert.ok(ley?.concepts);
    assert.equal(ley?.concepts?.items.length, 3);
    assert.ok(ley?.concepts?.items.some((item) => /acoso laboral/i.test(item.title)));
    assert.ok(ley?.checklist);
    assert.ok((ley?.checklist?.items.length ?? 0) >= 3);
    assert.ok(ley?.implicaPoints);
    assert.equal(ley?.implicaPoints?.items.length, 3);
    assert.ok(ley?.processSteps);
    assert.equal(ley?.processSteps?.items.length, 4);
    for (const materia of materias) {
      if (materia.slug === "ley-karin") continue;
      assert.equal(materia.concepts, undefined);
      assert.equal(materia.checklist, undefined);
      assert.equal(materia.implicaPoints, undefined);
      assert.equal(materia.processSteps, undefined);
    }
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

  it("MateriaPage es ficha institucional sin hero comercial", () => {
    const materiaPage = readFileSync("src/components/sites/cumple/MateriaPage.tsx", "utf8");
    assert.match(materiaPage, /titleName/);
    assert.match(materiaPage, /normRef/);
    assert.match(materiaPage, /content\.eyebrow/);
    assert.match(materiaPage, /citation\.anchor/);
    assert.match(materiaPage, /relatedPaths/);
    assert.match(materiaPage, /SourcesBlock/);
    assert.match(materiaPage, /disclaimer/);
    assert.match(materiaPage, /\/evaluar/);
    assert.match(materiaPage, /border-cline/);
    assert.match(materiaPage, /content\.concepts/);
    assert.match(materiaPage, /content\.checklist/);
    assert.match(materiaPage, /content\.implicaPoints/);
    assert.match(materiaPage, /content\.processSteps/);
    assert.match(materiaPage, /ConceptsBlock|materia-concepts/);
    assert.match(materiaPage, /ChecklistBlock|materia-checklist/);
    assert.match(materiaPage, /ImplicaPointsBlock|ProcessStepsBlock/);
    assert.doesNotMatch(materiaPage, /#071a45/);
    assert.doesNotMatch(materiaPage, /glow-btn/);
    assert.doesNotMatch(materiaPage, /orb-a/);
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
describe("Páginas de apoyo Cumple", () => {
  const supportPaths = ["/como-funciona", "/preguntas-frecuentes", "/evaluar", "/nosotros", "/contacto"];

  it("registra las cinco vistas de apoyo en production-views", async () => {
    const views = readFileSync("src/sites/production-views.tsx", "utf8");
    for (const path of supportPaths) {
      assert.match(views, new RegExp(path.replaceAll("/", "\\/")));
    }
    stubNextFonts();
    const { registerProductionPageViews } = await import("../../src/sites/production-views");
    registerProductionPageViews();
    for (const path of supportPaths) {
      assert.equal(typeof getCodedPageView(CUMPLE_TENANT_ID, path), "function", `sin vista: ${path}`);
    }
  });

  it("FAQ tiene al menos seis preguntas con respuesta y enlaces internos válidos", async () => {
    const { faqPage, faqItems } = await import("../../src/sites/cumple/pages/faq");
    const paths = new Set(cumpleSite.pages.map((page) => page.path));
    assert.match(faqPage.heading, /\S/);
    assert.ok(faqItems.length >= 6);
    for (const item of faqItems) {
      assert.match(item.q, /^¿.+\?$/);
      assert.ok(item.a.length > 40);
      for (const link of item.links ?? []) assert.ok(paths.has(link.href), link.href);
    }
    const all = faqItems.flatMap((item) => item.links?.map((link) => link.href) ?? []);
    assert.ok(all.includes("/evaluar"));
    assert.ok(all.some((href) => href.startsWith("/materias/")));
    const source = readFileSync("src/components/sites/cumple/pages/FaqPage.tsx", "utf8");
    assert.match(source, /<h2/);
  });

  it("Cómo funciona amplía los cuatro pasos con párrafos y CTA a evaluar", async () => {
    const { comoFunciona } = await import("../../src/sites/cumple/pages/como-funciona");
    const { pasos } = await import("../../src/sites/cumple/content");
    assert.equal(comoFunciona.steps.length, pasos.length);
    comoFunciona.steps.forEach((step, index) => {
      assert.equal(step.title, pasos[index].title);
      assert.ok(step.paragraphs.length >= 1 && step.paragraphs.length <= 2);
    });
    const page = readFileSync("src/components/sites/cumple/pages/ComoFuncionaPage.tsx", "utf8");
    assert.match(page, /\/evaluar/);
  });

  it("Evaluar usa EvalForm y Nosotros evita promesas ilegales", async () => {
    const evaluar = readFileSync("src/components/sites/cumple/pages/EvaluarPage.tsx", "utf8");
    assert.match(evaluar, /EvalForm/);
    const { evaluarPage } = await import("../../src/sites/cumple/pages/evaluar");
    const { nosotrosPage } = await import("../../src/sites/cumple/pages/nosotros");
    assert.match(evaluarPage.h1, /\S/);
    const copy = JSON.stringify([evaluarPage, nosotrosPage]);
    assert.doesNotMatch(copy, /garantiz|sin multas|evita(rá)? (las )?(multas|sanciones)|100 ?%/i);
    assert.match(copy, /consultor/i);
    assert.match(copy, /plataforma/i);
    assert.match(copy, /acompañamiento/i);
  });

  it("ContactoPage muestra solo campos no vacíos y no inventa Santiago", async () => {
    const source = readFileSync("src/components/sites/cumple/pages/ContactoPage.tsx", "utf8");
    assert.match(source, /contact\.email/);
    assert.match(source, /\/evaluar/);
    assert.doesNotMatch(source, /Santiago/);

    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { ContactoPage } = await import("../../src/components/sites/cumple/pages/ContactoPage");
    const empty = { email: "", phone: "", whatsapp: "", address: "", city: "", country: "", hours: "" };
    const noSocial = { facebook: "", instagram: "", youtube: "", linkedin: "", tiktok: "", spotify: "" };

    const vacio = renderToStaticMarkup(createElement(ContactoPage, { contact: empty, social: noSocial }));
    assert.doesNotMatch(vacio, /mailto:|tel:|Santiago|Instagram|LinkedIn/);
    assert.match(vacio, /href="\/evaluar"/);

    const lleno = renderToStaticMarkup(
      createElement(ContactoPage, {
        contact: { ...empty, email: "hola@ejemplo.cl", phone: "+56 2 2345 6789", city: "Valparaíso", country: "Chile" },
        social: { ...noSocial, linkedin: "https://www.linkedin.com/company/ejemplo" },
      }),
    );
    assert.match(lleno, /mailto:hola@ejemplo\.cl/);
    assert.match(lleno, /\+56 2 2345 6789/);
    assert.match(lleno, /Valparaíso, Chile/);
    assert.match(lleno, /linkedin\.com\/company\/ejemplo/);
    assert.doesNotMatch(lleno, /Instagram|Facebook/);
  });
});