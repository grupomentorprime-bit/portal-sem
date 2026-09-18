/**
 * OT-GROWTH-PILOT-FORMS-FIX-001 — admin Formularios usa el mismo SSOT
 * operacional que Páginas (sesión → site_config), no Host público.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const ADMIN_FORM_PAGES = [
  "src/app/admin/portal/forms/page.tsx",
  "src/app/admin/portal/forms/[id]/page.tsx",
  "src/app/admin/portal/convocatorias/configuracion/page.tsx",
  "src/app/admin/portal/asuntos-estudiantiles/[formId]/page.tsx",
] as const;

describe("OT-GROWTH-PILOT-FORMS-FIX-001 — admin forms SSOT operacional", () => {
  it("Páginas y Formularios comparten getOperationalSiteConfig", () => {
    const pages = readSrc("src/app/admin/pages/page.tsx");
    assert.match(pages, /getOperationalSiteConfig/);
    assert.doesNotMatch(pages, /getTenantContext/);

    for (const file of ADMIN_FORM_PAGES) {
      const src = readSrc(file);
      assert.match(src, /getOperationalSiteConfig/, file);
      assert.doesNotMatch(src, /getTenantContext/, file);
    }
  });

  it("no introduce hardcode de mentor-prime ni segundo resolver de portal", () => {
    for (const file of ADMIN_FORM_PAGES) {
      const src = readSrc(file);
      assert.doesNotMatch(src, /mentor-prime/i, file);
      assert.doesNotMatch(src, /resolvePublicTenantByHost/, file);
      assert.doesNotMatch(src, /getActiveTenantId/, file);
    }
  });

  it("APIs admin de form-experience siguen getOperationalTenantId", () => {
    const route = readSrc("src/app/api/cms/form-experience/[formId]/route.ts");
    assert.match(route, /getOperationalTenantId/);
    assert.doesNotMatch(route, /getTenantContext/);
  });
});
