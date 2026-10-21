/**
 * Menú CRM · Conversión: rutas existentes, permisos y sidebar plano.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import {
  findActiveNavGroupId,
  isNavGroupActive,
  NAV_SIDEBAR_ZONES,
  navGroupAsDirectLink,
  navGroupAsSidebarLink,
} from "@/lib/admin/nav-domains";

const FULL = [
  "cms.pages.read",
  "growth.people.view",
  "growth.sales.read",
  "growth.funnels.manage",
  "growth.campaigns.view",
  "growth.automations.view",
  "growth.analytics.view",
];

describe("CRM · Conversión — navegación", () => {
  it("Inicio queda fuera del grupo y Crecer conserva sus tres módulos", () => {
    const groups = filterAdminNavGroups(FULL, false, []);
    const conversion = groups.find((group) => group.id === "conversion");
    assert.ok(conversion);
    assert.equal(conversion.label, "CRM · Conversión");
    assert.deepEqual(
      conversion.items.map((item) => item.label),
      [
        "Panel comercial",
        "Oportunidades",
        "Personas",
        "Embudos",
        "Mi trabajo",
        "Mensajes",
        "Actividad",
      ]
    );
    assert.deepEqual(
      conversion.items.map((item) => item.href),
      [
        "/admin/conversion",
        "/admin/ventas",
        "/admin/personas",
        "/admin/ventas/embudos",
        "/admin/ventas/mi-trabajo",
        "/admin/mensajes",
        "/admin/actividad",
      ]
    );

    const core = NAV_SIDEBAR_ZONES.find((zone) => zone.id === "core");
    const grow = NAV_SIDEBAR_ZONES.find((zone) => zone.id === "grow");
    assert.deepEqual(core?.groupIds, ["dashboard", "conversion"]);
    assert.equal(grow?.label, "Crecer");
    assert.deepEqual(grow?.groupIds, ["campanas", "automatizaciones", "analitica"]);

    const dashboard = groups.find((group) => group.id === "dashboard");
    assert.equal(navGroupAsDirectLink(dashboard!)?.label, "Inicio");
  });

  it("sidebar plano: CRM usa el nombre del grupo y el panel comercial", () => {
    const groups = filterAdminNavGroups(FULL, false, []);
    const conversion = groups.find((group) => group.id === "conversion");
    assert.ok(conversion);
    const link = navGroupAsSidebarLink(conversion);
    assert.equal(link?.label, "CRM · Conversión");
    assert.equal(link?.href, "/admin/conversion");
    assert.equal(isNavGroupActive("/admin/personas", conversion), true);
    assert.equal(isNavGroupActive("/admin/campanas", conversion), false);
  });

  it("un solo enlace autorizado conserva el nombre del módulo", () => {
    const groups = filterAdminNavGroups(["growth.people.view"], false, []);
    const conversion = groups.find((group) => group.id === "conversion");
    assert.ok(conversion);
    assert.equal(conversion.items.length, 1);
    assert.equal(conversion.items[0]?.label, "Personas");
    assert.equal(navGroupAsDirectLink(conversion)?.label, "Personas");
    assert.equal(navGroupAsSidebarLink(conversion)?.label, "Personas");
    assert.notEqual(navGroupAsDirectLink(conversion)?.label, conversion.label);
    assert.equal(
      groups.some((group) => group.id === "campanas"),
      false
    );
  });

  it("cualquier sección de CRM activa el mismo grupo", () => {
    const groups = filterAdminNavGroups(FULL, false, []);
    for (const pathname of [
      "/admin/ventas",
      "/admin/ventas/opp-1",
      "/admin/personas",
      "/admin/personas/p-1",
      "/admin/ventas/embudos",
      "/admin/conversion",
      "/admin/ventas/mi-trabajo",
      "/admin/mensajes",
      "/admin/actividad",
    ]) {
      assert.equal(findActiveNavGroupId(pathname, groups), "conversion");
    }
    assert.equal(findActiveNavGroupId("/admin", groups), "dashboard");
    assert.equal(findActiveNavGroupId("/admin/campanas", groups), "campanas");
  });
});
