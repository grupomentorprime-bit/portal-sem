import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cumpleAsesorAllowed } from "../../src/sites/cumple/access";
import { CUMPLE_FORM_ID, CUMPLE_TENANT_ID, cumpleSite } from "../../src/sites/cumple/site";
import { fichasPara } from "../../src/sites/cumple/norma";
import { getCodedSite } from "../../src/sites/registry";

describe("sitio Mentor Prime Cumple", () => {
  it("no se registra al importar el contrato", () => {
    assert.equal(getCodedSite("cumple"), undefined);
    assert.equal(getCodedSite("sem"), undefined);
  });

  it("declara el espacio cumple, la página de inicio y el diagnóstico", () => {
    assert.equal(CUMPLE_TENANT_ID, "cumple");
    assert.equal(cumpleSite.tenantId, "cumple");
    assert.deepEqual(
      cumpleSite.pages.map((page) => page.path),
      [
        "/",
        "/materias/ley-karin",
        "/materias/seguridad-salud-trabajo",
        "/materias/laboral-rrhh",
        "/materias/proteccion-datos",
        "/materias/inclusion-laboral",
        "/materias/contratistas-terceros",
        "/como-funciona",
        "/preguntas-frecuentes",
        "/evaluar",
        "/nosotros",
        "/contacto",
      ]
    );
    const form = cumpleSite.forms[0];
    assert.equal(form?._id, CUMPLE_FORM_ID);
    assert.equal(form?.destination, "information_request");
    assert.equal(form?.fields.find((field) => field.name === "email")?.validation?.required, true);
    assert.equal(form?.fields.find((field) => field.name === "fullName")?.validation?.required, true);
    assert.equal(form?.fields.some((field) => field.name === "company"), true);
    assert.equal(form?.fields.some((field) => field.name === "organizationType"), true);
  });

  it("el asesor solo responde en el espacio cumple", () => {
    assert.equal(cumpleAsesorAllowed("cumple"), true);
    assert.equal(cumpleAsesorAllowed("sem"), false);
    assert.equal(cumpleAsesorAllowed("adl"), false);
    assert.equal(cumpleAsesorAllowed(null), false);
    const route = readFileSync("src/app/api/sites/cumple/asesor/route.ts", "utf8");
    assert.match(route, /cumpleAsesorAllowed/);
  });

  it("la base de normas sigue reconociendo Ley Karin", () => {
    const fichas = fichasPara("¿Qué exige la Ley Karin?");
    assert.ok(fichas.some((ficha) => ficha.titulo.includes("Ley Karin")));
  });

  it("el layout registra la producción y conserva la vista de respaldo", () => {
    const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");
    assert.match(layout, /ensureProductionCodedSites/);
    assert.match(layout, /getCodedPageView/);
    assert.match(layout, /CodedSiteView/);
    assert.match(layout, /ComingSoonPage/);
    assert.doesNotMatch(layout, /institution\.status/);
  });

  it("la página conserva el titular, el pie lee el contacto y el diagnóstico usa el formulario del sitio", () => {
    const home = readFileSync("src/components/sites/cumple/CumpleHome.tsx", "utf8");
    const footer = readFileSync("src/components/sites/cumple/CumpleFooter.tsx", "utf8");
    const form = readFileSync("src/components/sites/cumple/eval-form.tsx", "utf8");
    assert.match(home, /No descubra lo que falta durante[\s\S]{0,80}una fiscalizaci/);
    assert.match(footer, /contact\.email/);
    assert.match(form, /CUMPLE_FORM_ID/);
    assert.match(form, /\/api\/experience\/forms\//);
  });
});
