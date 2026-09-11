/**
 * OT-GROWTH-UX-ADMIN-SHELL-002 — patrón maestro aplicado a /admin productivo.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-UX-ADMIN-SHELL-002 — shell productivo", () => {
  it("navegación maestra: Core · Crecer · Sitio web / Equipo / Ajustes", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /id: "ventas"/);
    assert.match(nav, /href: "\/admin\/ventas"/);
    assert.match(nav, /id: "mensajes"/);
    assert.match(nav, /id: "actividad"/);
    assert.match(nav, /id: "campanas"/);
    assert.match(nav, /id: "automatizaciones"/);
    assert.match(nav, /id: "analitica"/);
    assert.match(nav, /id: "sitio-web"/);
    assert.match(nav, /id: "equipo"/);
    assert.match(nav, /id: "ajustes"/);
    assert.match(nav, /label: "Crecer"/);
    assert.match(nav, /id: "nav-mensajes"[\s\S]*?href: "\/admin\/mensajes"/);
    // Placeholder visual (sin página vacía): Campañas
    assert.match(nav, /id: "nav-campanas"[\s\S]*?href: null/);
  });

  it("reubica legacy bajo Sitio web / Ajustes sin borrar rutas", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    for (const href of [
      "/admin/pages",
      "/admin/menus",
      "/admin/experience-studio",
      "/admin/config",
      "/admin/content/programs",
      "/admin/content/courses",
      "/admin/portal/forms",
      "/admin/portal/asuntos-estudiantiles",
      "/admin/portal/admission",
      "/admin/content",
      "/admin/media",
      "/admin/settings/users",
      "/admin/settings/team",
      "/admin/settings/roles",
      "/admin/settings/activity",
      "/admin/personas",
    ]) {
      assert.match(nav, new RegExp(href.replace(/\//g, "\\/")));
    }
  });

  it("oferta académica sigue gated por programs.manage (no hardcode tenant)", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /academic-programs[\s\S]*programs\.manage/);
    assert.doesNotMatch(nav, /tenant\s*===\s*["']ADL["']/i);
    assert.doesNotMatch(nav, /tenant\s*===\s*["']SEM["']/i);
  });

  it("Inicio productivo reutiliza GrowthOsAdminHomeMaster", () => {
    const page = readSrc("src/app/admin/page.tsx");
    assert.match(page, /GrowthOsAdminHomeMaster/);
    assert.match(page, /loadGrowthOsHomeSnapshot/);
    assert.doesNotMatch(page, /AdminDashboardClient/);
  });

  it("sidebar claro + layout full-height; topbar Personas", () => {
    const css = readSrc("src/components/admin/shell-v2/admin-shell-v2.css");
    const shell = readSrc("src/components/admin/shell-v2/AdminShellV2.tsx");
    const topBar = readSrc("src/components/admin/kit/navigation/AdminTopBar.tsx");
    assert.match(css, /background:\s*var\(--color-surface-default\)/);
    assert.match(css, /height:\s*100vh/);
    assert.match(shell, /flex min-h-screen/);
    assert.match(topBar, /Buscar personas/);
    assert.doesNotMatch(topBar, /GlobalSearch/);
  });
});
