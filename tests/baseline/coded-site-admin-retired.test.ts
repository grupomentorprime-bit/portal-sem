import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_SIDEBAR_SUPPLEMENTAL, getAllNavTreeItems } from "../../src/lib/admin/nav-domains";
import {
  isRetiredContentSection,
  isRetiredSiteAdminPath,
} from "../../src/lib/admin/retired-site-admin";

const removedIds = [
  "portal-pages",
  "portal-menus",
  "institution-authorities",
  "academic-programs",
  "academic-courses",
  "communications-hub",
  "communications-media",
];

describe("retired site admin", () => {
  it("esas pantallas salen del menú", () => {
    const ids = new Set(getAllNavTreeItems().map((item) => item.id));
    for (const id of removedIds) assert.equal(ids.has(id), false);
    const supplemental = ADMIN_SIDEBAR_SUPPLEMENTAL.map((item) => item.href);
    assert.equal(supplemental.includes("/admin/menus"), false);
    assert.equal(ids.has("convocatorias-config"), true);
    assert.equal(ids.has("site-domain"), true);
    assert.equal(ids.has("institution-info"), true);
    assert.equal(ids.has("institution-branding"), true);
    assert.equal(ids.has("portal-admission"), true);
    assert.equal(ids.has("convocatorias-resultados"), true);
  });

  it("la URL ya no abre el editor y el resto del admin sigue", () => {
    assert.equal(isRetiredSiteAdminPath("/admin/pages"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/pages/abc"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/menus"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/menus/principal"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/media"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/people"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/programs/edit/1"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/content/news"), true);
    assert.equal(isRetiredSiteAdminPath("/admin/config"), false);
    assert.equal(isRetiredSiteAdminPath("/admin/portal/forms"), false);
    assert.equal(isRetiredSiteAdminPath("/admin/portal/admission"), false);
    assert.equal(isRetiredContentSection("people"), true);
    assert.equal(isRetiredContentSection("courses"), true);
    assert.equal(isRetiredContentSection("testimonials"), false);
  });
});
