import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { MongoClient } from "mongodb";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { PORTAL_TENANT_ROLES } from "../../src/core/identity/roles/defaults";
import { PROTECTED_OPERATIONAL_SPACE_IDS, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { IPN_CHILE_TENANT_ID, IPN_CHILE_VARONES } from "../../src/core/units/ipn-chile";
import { membershipUnitScope } from "../../src/core/units/access";
import { listOrgUnits } from "../../src/core/units/repository";
import { ORG_UNITS_COLLECTION } from "../../src/core/units/types";
import { decideAdminEntry, type AdminEntryInput } from "../../src/lib/admin/capability-boundary";
import { CONGRESS_VARONES_FORMS_ALIAS_PATH } from "../../src/lib/admin/nav-access";
import { filterAdminNavGroups } from "../../src/lib/admin/nav-access";
import { hasAppKey } from "../../src/lib/desktop/app-access";
import { clientDeskApps, specializedForDesk } from "../../src/lib/desktop/specialized";
import { createOwnedDatabase, dropOwnedDatabase } from "../../src/lib/mongo/destructive-guard";
import { assertNonProductionClient, classifyLocalMongo } from "../../src/lib/mongo/local-boundary";

const ROOT = process.cwd();
const VARONES = IPN_CHILE_VARONES.unitId;
const ADMISSION = "/admin/portal/admission";
const AFFAIRS = "/admin/portal/asuntos-estudiantiles";
const CONGRESS = "/admin/portal/congreso-varones";
const GROWTH = ["/admin", "/admin/ventas", "/admin/campanas", "/admin/personas", "/admin/mensajes"] as const;
const OTHER_SPACES = [
  "adl",
  "fundacion-mueve",
  "mentor-prime-capacitacion",
  "cumple",
  "saas-val-shell",
] as const;

function rolePermissions(code: string): string[] {
  const role = PORTAL_TENANT_ROLES.find((item) => item.code === code);
  assert.ok(role, code);
  return [...role.permissionIds];
}

function gate(input: Partial<AdminEntryInput> & Pick<AdminEntryInput, "pathname" | "tenantId" | "permissions">) {
  return decideAdminEntry({
    growthOs: false,
    roleCodes: [],
    unitIds: null,
    enabledUnitAppIds: null,
    ...input,
  });
}

function hrefs(permissions: string[], scope: { growthOs: boolean; opened: readonly string[] }): string[] {
  return filterAdminNavGroups(permissions, false, [], undefined, null, scope).flatMap((group) =>
    group.items.map((item) => item.href).filter((href): href is string => Boolean(href))
  );
}

describe("independencia del shell institucional", () => {
  it("el núcleo no importa Growth OS, SEM ni IPN", () => {
    const source = readFileSync(resolve(ROOT, "src/nelzuri/contracts/shell.ts"), "utf8");
    for (const forbidden of ["@/lib/", "@/core/", "@/app/", "seminario-ipn", "ipn-chile", "growth-os"]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
    const layout = readFileSync(resolve(ROOT, "src/app/admin/layout.tsx"), "utf8");
    assert.match(layout, /decideAdminEntry/);
    assert.equal(layout.includes("Growth OS exige llave"), false);
    assert.deepEqual(PROTECTED_OPERATIONAL_SPACE_IDS, [
      "seminario-ipn",
      "ipn-chile",
      "adl",
      "fundacion-mueve",
      "mentor-prime-capacitacion",
      "cumple",
    ]);
  });

  it("Admisión del SEM sin llave de Growth OS no abre el CRM", () => {
    const permissions = rolePermissions(ROLE_CODES.ADMISSIONS);
    const roleCodes = [ROLE_CODES.ADMISSIONS];
    assert.equal(
      hasAppKey("growth-os", { contracted: [], authorizedApps: null }),
      false
    );
    assert.deepEqual(
      specializedForDesk({
        tenantId: SEM_TENANT_ID,
        permissions,
        unitIds: null,
        enabledUnitAppIds: null,
        roleCodes,
        growthOs: false,
      }),
      ["admision"]
    );
    assert.equal(gate({ pathname: ADMISSION, tenantId: SEM_TENANT_ID, permissions, roleCodes }).kind, "allow");
    assert.equal(
      gate({ pathname: `${ADMISSION}/pasos`, tenantId: SEM_TENANT_ID, permissions, roleCodes }).kind,
      "allow"
    );
    for (const pathname of [...GROWTH, AFFAIRS, CONGRESS, "/admin/portal/forms"]) {
      const decision = gate({ pathname, tenantId: SEM_TENANT_ID, permissions, roleCodes });
      assert.equal(decision.kind, "redirect", pathname);
      if (decision.kind === "redirect") assert.equal(decision.href, ADMISSION, pathname);
    }
    const nav = hrefs(permissions, { growthOs: false, opened: ["admision"] });
    assert.deepEqual(nav, [ADMISSION]);
    assert.equal(nav.some((href) => href.startsWith("/admin/ventas")), false);
    assert.equal(nav.some((href) => href.startsWith("/admin/campanas")), false);
  });

  it("Asuntos Estudiantiles del SEM sin llave queda en esa capacidad", () => {
    const permissions = rolePermissions(ROLE_CODES.STUDENT_AFFAIRS);
    const roleCodes = [ROLE_CODES.STUDENT_AFFAIRS];
    assert.equal(gate({ pathname: AFFAIRS, tenantId: SEM_TENANT_ID, permissions, roleCodes }).kind, "allow");
    assert.equal(
      gate({ pathname: `${AFFAIRS}/cohortes`, tenantId: SEM_TENANT_ID, permissions, roleCodes }).kind,
      "allow"
    );
    const equipo = gate({
      pathname: `${AFFAIRS}/equipo`,
      tenantId: SEM_TENANT_ID,
      permissions,
      roleCodes,
    });
    assert.equal(equipo.kind, "redirect");
    if (equipo.kind === "redirect") assert.equal(equipo.href, AFFAIRS);
    for (const pathname of [ADMISSION, CONGRESS, ...GROWTH]) {
      const decision = gate({ pathname, tenantId: SEM_TENANT_ID, permissions, roleCodes });
      assert.equal(decision.kind, "redirect", pathname);
      if (decision.kind === "redirect") assert.equal(decision.href, AFFAIRS, pathname);
    }
  });

  it("el Congreso de IPN Chile sin llave no abre Growth OS", () => {
    const permissions = rolePermissions(ROLE_CODES.CONGRESS_OPERATOR);
    const roleCodes = [ROLE_CODES.CONGRESS_OPERATOR];
    const input = { tenantId: IPN_CHILE_TENANT_ID, permissions, roleCodes };
    assert.equal(gate({ pathname: CONGRESS, ...input }).kind, "allow");
    assert.equal(gate({ pathname: CONGRESS_VARONES_FORMS_ALIAS_PATH, ...input }).kind, "allow");
    for (const pathname of [ADMISSION, AFFAIRS, ...GROWTH, "/admin/campanas"]) {
      const decision = gate({ pathname, ...input });
      assert.equal(decision.kind, "redirect", pathname);
      if (decision.kind === "redirect") assert.equal(decision.href, CONGRESS, pathname);
    }
    const withKey = gate({ pathname: "/admin/ventas", ...input, growthOs: true });
    assert.equal(withKey.kind, "redirect");
    if (withKey.kind === "redirect") assert.equal(withKey.href, CONGRESS);
  });

  it("Growth OS sin permiso institucional no abre las capacidades", () => {
    const permissions = ["growth.sales.read", "growth.campaigns.view", "growth.people.view"];
    assert.equal(
      hasAppKey("growth-os", {
        contracted: ["growth-os"],
        authorizedApps: ["growth-os"],
      }),
      true
    );
    assert.equal(
      hasAppKey("growth-os", { contracted: ["growth-os"], authorizedApps: [] }),
      false
    );
    for (const tenantId of [SEM_TENANT_ID, IPN_CHILE_TENANT_ID]) {
      assert.equal(gate({ pathname: "/admin", tenantId, permissions, growthOs: true }).kind, "allow");
      assert.equal(gate({ pathname: "/admin/ventas", tenantId, permissions, growthOs: true }).kind, "allow");
      assert.equal(gate({ pathname: "/admin/campanas", tenantId, permissions, growthOs: true }).kind, "allow");
      for (const pathname of [ADMISSION, AFFAIRS, CONGRESS, CONGRESS_VARONES_FORMS_ALIAS_PATH]) {
        const decision = gate({ pathname, tenantId, permissions, growthOs: true });
        assert.equal(decision.kind, "redirect", `${tenantId} ${pathname}`);
        if (decision.kind === "redirect") assert.equal(decision.href, "/admin");
      }
    }
    const nav = hrefs(permissions, { growthOs: true, opened: [] });
    assert.equal(nav.includes(ADMISSION), false);
    assert.equal(nav.includes(AFFAIRS), false);
    assert.equal(nav.includes(CONGRESS), false);
    assert.equal(nav.includes("/admin/ventas"), true);
    assert.equal(nav.includes("/admin/campanas"), true);
  });

  it("otro Espacio no entra, y la mesa vacía sigue en pie", () => {
    const permissions = [
      ...rolePermissions(ROLE_CODES.ADMISSIONS),
      ...rolePermissions(ROLE_CODES.STUDENT_AFFAIRS),
      ...rolePermissions(ROLE_CODES.CONGRESS_OPERATOR),
    ];
    for (const tenantId of OTHER_SPACES) {
      for (const growthOs of [false, true]) {
        for (const pathname of [ADMISSION, AFFAIRS, CONGRESS]) {
          const decision = gate({ pathname, tenantId, permissions, growthOs });
          assert.equal(decision.kind, "redirect", `${tenantId} ${pathname}`);
          if (decision.kind === "redirect") {
            assert.equal(decision.href, growthOs ? "/admin" : "/escritorio");
          }
        }
      }
      assert.equal(gate({ pathname: "/admin", tenantId, permissions, growthOs: true }).kind, "allow");
      const denied = gate({ pathname: "/admin/ventas", tenantId, permissions, growthOs: false });
      assert.equal(denied.kind, "redirect");
      if (denied.kind === "redirect") assert.equal(denied.href, "/escritorio");
    }

    assert.deepEqual(
      clientDeskApps({
        owner: false,
        spaceType: null,
        contracted: [],
        authorizedApps: [],
        tenantId: "saas-val-vacio",
        permissions: [],
        unitIds: null,
        enabledUnitAppIds: null,
        growthOs: false,
      }),
      ["mensajes"]
    );
    assert.deepEqual(
      clientDeskApps({
        owner: false,
        spaceType: "education",
        contracted: [],
        authorizedApps: [],
        tenantId: SEM_TENANT_ID,
        permissions: rolePermissions(ROLE_CODES.ADMISSIONS),
        roleCodes: [ROLE_CODES.ADMISSIONS],
        unitIds: null,
        enabledUnitAppIds: null,
        growthOs: false,
      }),
      ["admision", "mensajes"]
    );
  });

  it("la unidad sintética sigue cerrando el Congreso", async (t) => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      t.skip("Mongo aislado no autorizado");
      return;
    }
    assertNonProductionClient(uri, process.env);
    if (classifyLocalMongo(uri, process.env) !== "isolated-test") {
      throw new Error("Las pruebas solo abren el Mongo isolated-test.");
    }
    const owned = createOwnedDatabase(process.env);
    const client = new MongoClient(uri);
    const now = "2026-11-22T00:00:00.000Z";
    const permissions = rolePermissions(ROLE_CODES.CONGRESS_OPERATOR);
    try {
      await client.connect();
      const db = client.db(owned.name);
      await db.collection(ORG_UNITS_COLLECTION).insertMany([
        {
          tenantId: IPN_CHILE_TENANT_ID,
          unitId: VARONES,
          name: "Departamento Nacional de Varones",
          kind: "department",
          status: "active",
          responsibleUserIds: [],
          enabledAppIds: ["sitio-web"],
          createdAt: now,
          updatedAt: now,
        },
        {
          tenantId: IPN_CHILE_TENANT_ID,
          unitId: "otra-unidad-sintetica",
          name: "Otra unidad sintética",
          kind: "unit",
          status: "active",
          responsibleUserIds: [],
          enabledAppIds: ["sitio-web"],
          createdAt: now,
          updatedAt: now,
        },
      ]);
      const units = await listOrgUnits(db, IPN_CHILE_TENANT_ID);
      const varones = membershipUnitScope({
        unitAccess: { mode: "units", unitIds: [VARONES] },
        units,
      });
      const otra = membershipUnitScope({
        unitAccess: { mode: "units", unitIds: ["otra-unidad-sintetica"] },
        units,
      });
      assert.equal(
        gate({
          pathname: CONGRESS,
          tenantId: IPN_CHILE_TENANT_ID,
          permissions,
          roleCodes: [ROLE_CODES.CONGRESS_OPERATOR],
          unitIds: varones.unitIds,
          enabledUnitAppIds: varones.enabledUnitAppIds,
        }).kind,
        "allow"
      );
      const blocked = gate({
        pathname: CONGRESS,
        tenantId: IPN_CHILE_TENANT_ID,
        permissions,
        roleCodes: [ROLE_CODES.CONGRESS_OPERATOR],
        unitIds: otra.unitIds,
        enabledUnitAppIds: otra.enabledUnitAppIds,
      });
      assert.equal(blocked.kind, "redirect");
      if (blocked.kind === "redirect") assert.equal(blocked.href, "/escritorio");
      assert.equal(await db.collection("identity_users").countDocuments(), 0);
      assert.equal(await db.collection("tenants").countDocuments(), 0);
    } finally {
      try {
        await dropOwnedDatabase(client, uri, owned, process.env);
      } finally {
        await client.close();
      }
    }
  });
});
