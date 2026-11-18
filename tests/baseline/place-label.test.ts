/**
 * El escritorio y la plataforma nombran el departamento cuando la persona está ahí.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { IPN_CHILE_VARONES } from "@/core/units/ipn-chile";
import {
  departmentPlaceName,
  departmentUnitIdsForPlace,
} from "@/lib/identity/place-label";

describe("lugar del departamento", () => {
  it("en IPN Chile cualquier rol muestra el Departamento Nacional de Varones", () => {
    assert.deepEqual(
      departmentUnitIdsForPlace({
        tenantId: "ipn-chile",
        roleCodes: ["congress_operator"],
        unitAccess: { mode: "tenant" },
      }),
      [IPN_CHILE_VARONES.unitId]
    );
    assert.deepEqual(
      departmentUnitIdsForPlace({
        tenantId: "ipn-chile",
        roleCodes: ["support"],
        unitAccess: { mode: "tenant" },
      }),
      [IPN_CHILE_VARONES.unitId]
    );
    assert.deepEqual(
      departmentUnitIdsForPlace({
        tenantId: "ipn-chile",
        roleCodes: ["institution_admin"],
      }),
      [IPN_CHILE_VARONES.unitId]
    );
  });

  it("el acceso por unidad manda sobre el Espacio", () => {
    assert.deepEqual(
      departmentUnitIdsForPlace({
        tenantId: "ipn-chile",
        roleCodes: ["institution_admin"],
        unitAccess: { mode: "units", unitIds: ["sede-norte"] },
      }),
      ["sede-norte"]
    );
  });

  it("otro Espacio sin unidad no inventa departamento", () => {
    assert.deepEqual(
      departmentUnitIdsForPlace({
        tenantId: "otro",
        roleCodes: ["institution_admin"],
      }),
      []
    );
  });

  it("el nombre visible es el de la unidad activa", () => {
    assert.equal(
      departmentPlaceName({
        unitIds: [IPN_CHILE_VARONES.unitId],
        units: [
          {
            unitId: IPN_CHILE_VARONES.unitId,
            name: "Departamento Nacional de Varones",
            status: "active",
          },
        ],
      }),
      "Departamento Nacional de Varones"
    );
    assert.equal(
      departmentPlaceName({
        unitIds: [IPN_CHILE_VARONES.unitId],
        units: [],
      }),
      "Departamento Nacional de Varones"
    );
    assert.equal(
      departmentPlaceName({
        unitIds: ["sede-norte"],
        units: [{ unitId: "sede-norte", name: "Sede Norte", status: "archived" }],
      }),
      ""
    );
  });

  it("el escritorio y la plataforma muestran ese nombre", () => {
    const root = resolve(process.cwd());
    const desk = readFileSync(resolve(root, "src/app/escritorio/page.tsx"), "utf8");
    const layout = readFileSync(resolve(root, "src/app/admin/layout.tsx"), "utf8");
    const home = readFileSync(resolve(root, "src/app/admin/page.tsx"), "utf8");
    assert.match(desk, /activeDepartmentName/);
    assert.match(desk, /departmentName \|\| active\?\.name/);
    assert.match(layout, /activeDepartmentName/);
    assert.match(layout, /institutionShortName: departmentName/);
    assert.match(home, /departmentName \|\|/);
  });
});
