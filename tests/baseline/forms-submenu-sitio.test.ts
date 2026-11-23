/**
 * Formularios es una entrada propia. Adentro: creación, edición y operación.
 * Dominio y Ajustes del sitio viven dentro de Sitio web.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import { isSidebarItemActive } from "@/lib/admin/nav-domains";

const SITE = ["cms.pages.read", "settings.update"];
const FORMS = ["experience.forms.read", "settings.update"];

describe("Formularios · submenú propio", () => {
  it("Sitio web agrupa Dominio y Ajustes; Formularios queda aparte", () => {
    const groups = filterAdminNavGroups(SITE, false, []);
    const sitio = groups.find((group) => group.id === "sitio-web");
    assert.ok(sitio);
    assert.deepEqual(
      sitio.items.map((item) => item.label),
      ["Sitio web"]
    );
    assert.equal(sitio.items[0]?.href, "/admin/site/pages");
    assert.deepEqual(
      sitio.items[0]?.children?.map((child) => child.label),
      ["Dominio", "Ajustes del sitio"]
    );
    assert.equal(
      sitio.items.some((item) => item.href === "/admin/portal/forms"),
      false
    );
  });

  it("Formularios abre creación, edición y operación", () => {
    const withoutForms = filterAdminNavGroups(SITE, false, []);
    assert.equal(
      withoutForms
        .find((group) => group.id === "sitio-web")
        ?.items.some((item) => item.id === "convocatorias-config"),
      false
    );

    const forms = filterAdminNavGroups(FORMS, false, [])
      .find((group) => group.id === "sitio-web")
      ?.items.find((item) => item.id === "convocatorias-config");
    assert.equal(forms?.href, "/admin/portal/forms");
    assert.deepEqual(
      forms?.children?.map((child) => child.label),
      ["Creación", "Edición", "Operación"]
    );
    assert.equal(
      forms?.children?.find((child) => child.id === "forms-operation")?.href,
      "/admin/portal/forms/panel"
    );
    const visible = forms?.children?.filter((child) =>
      child.requiredAnyPermission?.some((permission) => FORMS.includes(permission))
    );
    assert.deepEqual(
      visible?.map((child) => child.label),
      ["Creación", "Edición", "Operación"]
    );
    assert.equal(
      forms?.children?.some((child) =>
        child.requiredAnyPermission?.includes("cms.pages.read") ||
        child.requiredAnyPermission?.includes("congress.view")
      ),
      false
    );
  });

  it("Sitio web sigue activo en Dominio y Ajustes, sin tocar Identidad visual", () => {
    const groups = filterAdminNavGroups(SITE, false, []);
    const site = groups
      .find((group) => group.id === "sitio-web")
      ?.items.find((item) => item.id === "site-pages");
    assert.ok(site);
    const domain = site.children?.find((child) => child.id === "site-domain");
    const ajustes = site.children?.find((child) => child.id === "institution-info");
    assert.ok(domain && ajustes);

    assert.equal(isSidebarItemActive("/admin/site/pages", site), true);
    assert.equal(isSidebarItemActive("/admin/site/domain", site), true);
    assert.equal(isSidebarItemActive("/admin/config", site), true);
    assert.equal(
      isSidebarItemActive("/admin/config", site, new URLSearchParams("section=branding")),
      false
    );

    assert.equal(isSidebarItemActive("/admin/site/domain", domain), true);
    assert.equal(isSidebarItemActive("/admin/config", ajustes), true);
    assert.equal(
      isSidebarItemActive("/admin/config", ajustes, new URLSearchParams("section=branding")),
      false
    );
  });

  it("Creación, Edición y Operación marcan la vista activa sin solaparse", () => {
    const groups = filterAdminNavGroups(FORMS, false, []);
    const forms = groups
      .find((group) => group.id === "sitio-web")
      ?.items.find((item) => item.id === "convocatorias-config");
    assert.ok(forms);
    const create = forms.children?.find((child) => child.id === "forms-create");
    const edit = forms.children?.find((child) => child.id === "forms-edit");
    const operation = forms.children?.find((child) => child.id === "forms-operation");
    assert.ok(create && edit && operation);

    assert.equal(isSidebarItemActive("/admin/portal/forms", forms), true);
    assert.equal(isSidebarItemActive("/admin/portal/forms/panel", forms), true);
    assert.equal(isSidebarItemActive("/admin/site/pages", forms), false);
    assert.equal(isSidebarItemActive("/admin/site/domain", forms), false);

    assert.equal(isSidebarItemActive("/admin/portal/forms", create), true);
    assert.equal(isSidebarItemActive("/admin/portal/forms/abc", create), false);
    assert.equal(isSidebarItemActive("/admin/portal/forms/panel", create), false);

    assert.equal(isSidebarItemActive("/admin/portal/forms", edit), false);
    assert.equal(isSidebarItemActive("/admin/portal/forms/abc", edit), true);
    assert.equal(isSidebarItemActive("/admin/portal/forms/panel", edit), false);
    assert.equal(isSidebarItemActive("/admin/portal/forms/panel/abc", edit), false);

    assert.equal(isSidebarItemActive("/admin/portal/forms/panel", operation), true);
    assert.equal(isSidebarItemActive("/admin/portal/forms/panel/abc", operation), true);
    assert.equal(isSidebarItemActive("/admin/portal/forms", operation), false);
  });

  it("Asuntos Estudiantiles sigue en Institución", () => {
    const groups = filterAdminNavGroups(
      ["student-affairs.read", "experience.forms.read", "cms.pages.read"],
      false,
      []
    );
    const institucion = groups.find((group) => group.id === "institucion");
    assert.ok(
      institucion?.items.some(
        (item) => item.href === "/admin/portal/asuntos-estudiantiles"
      )
    );
    const sitio = groups.find((group) => group.id === "sitio-web");
    assert.equal(
      sitio?.items.some((item) => item.href === "/admin/portal/asuntos-estudiantiles"),
      false
    );
    const formsOnly = filterAdminNavGroups(["experience.forms.read"], false, []);
    assert.equal(
      formsOnly
        .find((group) => group.id === "institucion")
        ?.items.some((item) => item.href === "/admin/portal/asuntos-estudiantiles") ?? false,
      false
    );
  });
});
