import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";
import { isRetiredSiteAdminPath } from "../../src/lib/admin/retired-site-admin";
import { getAllNavTreeItems } from "../../src/lib/admin/nav-domains";
import { clearCodedSites, getCodedSite } from "../../src/sites/registry";
import { ensureProductionCodedSites } from "../../src/sites/production";
import { CUMPLE_TENANT_ID } from "../../src/sites/cumple/site";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("editor de contenido del sitio", () => {
  afterEach(() => {
    clearCodedSites();
  });

  it("Sitio web incluye Páginas en /admin/site/pages y no reabre el editor viejo", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    const sitioStart = nav.indexOf('id: "sitio-web"');
    const sitioEnd = nav.indexOf('id: "institucion"', sitioStart);
    const sitio = nav.slice(sitioStart, sitioEnd);

    assert.match(sitio, /id: "site-pages"/);
    assert.match(sitio, /label: "Páginas"/);
    assert.match(sitio, /href: "\/admin\/site\/pages"/);
    assert.doesNotMatch(sitio, /href: "\/admin\/pages"/);

    const ids = new Set(getAllNavTreeItems().map((item) => item.id));
    assert.equal(ids.has("site-pages"), true);
    assert.equal(ids.has("portal-pages"), false);

    assert.equal(isRetiredSiteAdminPath("/admin/pages"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/site/pages"), false);
  });

  it("la API de contenido vive en /api/site/pages", () => {
    const route = readSrc("src/app/api/site/pages/route.ts");
    assert.match(route, /cms\.pages\.read/);
    assert.match(route, /cms\.pages\.update/);
    assert.match(route, /sanitizeStoredContent/);
    assert.match(route, /ensureProductionCodedSites/);
  });

  it("el panel de páginas usa el selector de medios y el interruptor de animación", () => {
    const page = readSrc("src/app/admin/site/pages/page.tsx");
    const client = readSrc("src/components/admin/site/SitePagesClient.tsx");
    assert.match(page, /SitePagesClient/);
    assert.match(client, /MediaField/);
    assert.match(client, /Switch/);
    assert.match(client, /\/api\/site\/pages/);
    assert.match(client, /\/admin\/config\?section=contact/);
    assert.match(client, /\/admin\/config\?section=branding/);
    assert.match(client, /\/api\/site\/public-content/);
  });

  it("producción solo registra Cumple como sitio de este repositorio", () => {
    ensureProductionCodedSites();
    assert.equal(getCodedSite(CUMPLE_TENANT_ID)?.tenantId, "cumple");
    assert.equal(getCodedSite("mentor-prime-capacitacion"), undefined);
    assert.equal(getCodedSite("adl"), undefined);

    const cumple = getCodedSite(CUMPLE_TENANT_ID);
    assert.ok(cumple?.pages.some((page) => page.path === "/" && (page.slots?.length ?? 0) > 0));
  });

  it("borrar un espacio también borra el overlay de páginas", () => {
    const source = readSrc("src/core/tenant/delete-platform-space.ts");
    assert.match(source, /site_page_content/);
  });

  it("el layout público aplica el overlay al renderizar", () => {
    const layout = readSrc("src/app/(site)/layout.tsx");
    assert.match(layout, /resolvePageContent/);
    assert.match(layout, /getSitePageContent/);
  });

  it("el metadata del sitio de código usa el título de la página", () => {
    const meta = readSrc("src/lib/cms/metadata.ts");
    assert.match(meta, /getCodedSite/);
    assert.match(meta, /page\.title/);
  });
});
