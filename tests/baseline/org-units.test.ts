/**
 * Unidades internas de un Espacio.
 * IPN Chile es un cliente. Los departamentos no son otros Espacios.
 * SEM y el resto de clientes no entran en esta estructura.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import {
  canReadUnitDocument,
  documentListUnitIds,
  grantUnitAccess,
  invitationVisibleTo,
  memberVisibleTo,
  resolveUploadUnitId,
  revokeUnitAccess,
} from "../../src/core/units/access";
import { isUnitScopedAdminPathAllowed } from "../../src/lib/admin/nav-access";
import {
  IPN_CHILE_TENANT_ID,
  IPN_CHILE_VARONES,
  ipnChileFoundationSpec,
  normalizeEnabledAppIds,
} from "../../src/core/units/ipn-chile";

const varones = "departamento-nacional-de-varones";
const dorcas = "dorcas";

describe("acceso de una unidad interna", () => {
  it("un miembro del departamento no lee documentos de otra unidad", () => {
    const access = { mode: "units" as const, unitIds: [varones] };
    assert.equal(canReadUnitDocument(access, dorcas), false);
    assert.equal(canReadUnitDocument(access, varones), true);
    assert.equal(canReadUnitDocument(access, undefined), false);
  });

  it("una autorización explícita abre solo la unidad agregada", () => {
    const access = grantUnitAccess(
      { mode: "units", unitIds: [varones] },
      { mode: "units", unitIds: [dorcas] }
    );
    assert.deepEqual(access, { mode: "units", unitIds: [varones, dorcas] });
    assert.equal(canReadUnitDocument(access, dorcas), true);
  });

  it("la administración central del Espacio ve todas las unidades", () => {
    const access = { mode: "tenant" as const };
    assert.equal(canReadUnitDocument(access, dorcas), true);
    assert.equal(canReadUnitDocument(access, undefined), true);
    assert.equal(documentListUnitIds(access), null);
  });

  it("una membresía sin alcance de unidad sigue viendo el Espacio completo", () => {
    assert.equal(canReadUnitDocument(undefined, varones), true);
    assert.equal(canReadUnitDocument(undefined, undefined), true);
    assert.equal(documentListUnitIds(undefined), null);
    assert.deepEqual(documentListUnitIds({ mode: "units", unitIds: [varones] }), [varones]);
  });

  it("un documento nuevo queda en la unidad del miembro", () => {
    const access = { mode: "units" as const, unitIds: [varones] };
    assert.deepEqual(resolveUploadUnitId(access, null), { ok: true, unitId: varones });
    assert.deepEqual(resolveUploadUnitId(access, dorcas), { ok: false });
    assert.deepEqual(resolveUploadUnitId({ mode: "tenant" }, dorcas), {
      ok: true,
      unitId: dorcas,
    });
    assert.deepEqual(resolveUploadUnitId(undefined, null), { ok: true });
  });

  it("otorgar una unidad no rebaja a quien ya administra el Espacio", () => {
    const access = grantUnitAccess({ mode: "tenant" }, { mode: "units", unitIds: [varones] });
    assert.deepEqual(access, { mode: "tenant" });
    assert.deepEqual(
      grantUnitAccess(undefined, { mode: "units", unitIds: [varones] }),
      { mode: "tenant" }
    );
    assert.deepEqual(
      revokeUnitAccess({ mode: "units", unitIds: [varones, dorcas] }, dorcas),
      { mode: "units", unitIds: [varones] }
    );
    assert.deepEqual(revokeUnitAccess({ mode: "tenant" }, varones), { mode: "tenant" });
    assert.equal(revokeUnitAccess(undefined, varones), undefined);
  });

  it("un departamento no ve miembros ni invitaciones de otro", () => {
    const caller = { mode: "units" as const, unitIds: [varones] };
    assert.equal(memberVisibleTo(caller, { mode: "units", unitIds: [dorcas] }), false);
    assert.equal(memberVisibleTo(caller, { mode: "units", unitIds: [varones] }), true);
    assert.equal(memberVisibleTo(caller, { mode: "tenant" }), true);
    assert.equal(memberVisibleTo(undefined, { mode: "units", unitIds: [dorcas] }), true);
    assert.equal(
      invitationVisibleTo(caller, { mode: "units", unitIds: [dorcas] }),
      false
    );
    assert.equal(invitationVisibleTo(caller, undefined), false);
    assert.equal(
      invitationVisibleTo(caller, { mode: "units", unitIds: [varones] }),
      true
    );
  });
});

describe("aplicaciones del Espacio habilitadas por unidad", () => {
  it("rechaza una aplicación que no existe en el catálogo actual", () => {
    const result = normalizeEnabledAppIds(["conversion", "sistema-nuevo"]);
    assert.equal(result.ok, false);
  });

  it("acepta aplicaciones que ya son módulos del Espacio", () => {
    const result = normalizeEnabledAppIds(["conversion", "institucion"]);
    assert.deepEqual(result, { ok: true, appIds: ["conversion", "institucion"] });
  });

  it("un miembro de unidad solo entra a las aplicaciones habilitadas", () => {
    assert.equal(isUnitScopedAdminPathAllowed("/admin/ventas", ["conversion"]), true);
    assert.equal(isUnitScopedAdminPathAllowed("/admin/campanas", ["conversion"]), false);
    assert.equal(isUnitScopedAdminPathAllowed("/admin", ["conversion"]), true);
    assert.equal(isUnitScopedAdminPathAllowed("/admin/settings/team", ["conversion"]), false);
    assert.equal(isUnitScopedAdminPathAllowed("/admin/settings/team", null), true);
  });
});

describe("IPN Chile", () => {
  it("es un Espacio propio y Varones es su primera unidad interna", () => {
    const spec = ipnChileFoundationSpec();
    assert.equal(spec.tenantId, IPN_CHILE_TENANT_ID);
    assert.equal(spec.tenantId, "ipn-chile");
    assert.notEqual(spec.tenantId, SEM_TENANT_ID);
    assert.equal(spec.name, "IPN Chile");
    assert.equal(spec.unit.unitId, IPN_CHILE_VARONES.unitId);
    assert.equal(spec.unit.name, "Departamento Nacional de Varones");
    assert.equal(spec.unit.kind, "department");
    assert.equal("parentTenantId" in spec, false);
  });
});
