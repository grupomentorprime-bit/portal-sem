/**
 * OT-GROWTH-WEB-LANDING-IMPLEMENT-001 — Sitio web V1 ordenado.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PAGE_OBJECTIVES,
  objectiveLabelForTemplate,
  pageIdFromTitle,
  pathFromTitle,
  seedBlocksForObjective,
} from "../../src/lib/cms/page-objectives";
import {
  GROWTH_BLOCK_PRIORITY,
  humanBlockLabel,
} from "../../src/lib/cms/growth-block-palette";
import { DEFAULT_TEMPLATES } from "../../src/lib/cms/page-defaults";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-WEB-LANDING-IMPLEMENT-001 — Sitio web V1", () => {
  it("nav Sitio web: Páginas · Formularios · Menús · Dominio · Ajustes del sitio", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    const sitioStart = nav.indexOf('id: "sitio-web"');
    const sitioEnd = nav.indexOf('id: "institucion"', sitioStart);
    const sitio = nav.slice(sitioStart, sitioEnd);

    assert.match(sitio, /label: "Páginas"/);
    assert.match(sitio, /label: "Formularios"/);
    assert.match(sitio, /label: "Menús"/);
    assert.match(sitio, /label: "Dominio"/);
    assert.match(sitio, /label: "Ajustes del sitio"/);
    assert.match(sitio, /href: "\/admin\/site\/domain"/);

    assert.doesNotMatch(sitio, /label: "Editor visual"/);
    assert.doesNotMatch(sitio, /label: "Centro de admisión"/);
    assert.doesNotMatch(sitio, /label: "Comunicaciones"/);
    assert.doesNotMatch(sitio, /label: "Programas"/);
    assert.doesNotMatch(sitio, /label: "Cursos"/);
  });

  it("capacidades reubicadas en Institución (sin borrar rutas)", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /id: "institucion"/);
    for (const href of [
      "/admin/content/programs",
      "/admin/content/courses",
      "/admin/content/people",
      "/admin/content",
      "/admin/media",
      "/admin/portal/admission",
      "/admin/portal/asuntos-estudiantiles",
      "/admin/experience-studio",
    ]) {
      assert.match(nav, new RegExp(href.replace(/\//g, "\\/")));
    }
  });

  it("wizard por objetivo siembra bloques y usa plantillas tipadas", () => {
    assert.equal(PAGE_OBJECTIVES.length, 4);
    assert.deepEqual(
      PAGE_OBJECTIVES.map((o) => o.id),
      ["normal", "landing", "service", "contact"]
    );

    const landing = PAGE_OBJECTIVES.find((o) => o.id === "landing")!;
    const blocks = seedBlocksForObjective(landing);
    assert.ok(blocks.some((b) => b.type === "hero"));
    assert.ok(blocks.some((b) => b.type === "experience_form"));
    assert.equal(landing.template, "landing");

    const service = PAGE_OBJECTIVES.find((o) => o.id === "service")!;
    assert.equal(service.template, "program");
    assert.equal(objectiveLabelForTemplate("contact"), "Contacto");
  });

  it("plantillas DEFAULT incluyen institutional / landing / program / contact", () => {
    const ids = DEFAULT_TEMPLATES.map((t) => t._id);
    assert.ok(ids.includes("institutional"));
    assert.ok(ids.includes("landing"));
    assert.ok(ids.includes("program"));
    assert.ok(ids.includes("contact"));

    const landing = DEFAULT_TEMPLATES.find((t) => t._id === "landing")!;
    assert.ok(landing.blocks.some((b) => b.type === "experience_form"));
  });

  it("lenguaje humano: id/slug derivados, sin protagonismo técnico", () => {
    assert.equal(pageIdFromTitle("Inscripciones 2026"), "inscripciones-2026");
    assert.equal(pathFromTitle("Contacto"), "/contacto");
    assert.equal(humanBlockLabel("experience_form", "x"), "Formulario");
    assert.ok(GROWTH_BLOCK_PRIORITY.includes("hero"));
    assert.ok(GROWTH_BLOCK_PRIORITY.includes("experience_form"));

    const list = readSrc("src/components/page-builder/PageListClient.tsx");
    assert.match(list, /Crear página/);
    assert.doesNotMatch(list, /label: "ID"/);
    assert.match(list, /CreatePageWizard/);

    const toolbar = readSrc("src/components/visual-builder/StudioToolbar.tsx");
    assert.doesNotMatch(toolbar, />Experience Studio</);
  });

  it("FormExperience no se presenta como constructor de páginas", () => {
    const detail = readSrc("src/components/admin/forms/FormDetailClient.tsx");
    assert.match(detail, /Presentación/);
    assert.match(detail, /Sitio web → Páginas/);
    assert.doesNotMatch(detail, />Experiencia</);
  });

  it("superficie Dominio existe (solo lectura hosts)", () => {
    const page = readSrc("src/app/admin/site/domain/page.tsx");
    assert.match(page, /findDomainsByTenantId/);
    assert.match(page, /Dirección principal/);
    assert.doesNotMatch(page, /Cloudflare|DNS record|changeDomainHost/);
  });
});
