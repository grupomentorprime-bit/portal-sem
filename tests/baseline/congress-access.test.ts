import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { ROLE_PERMISSION_TEMPLATES } from "../../src/core/identity/permissions/role-templates";
import {
  isCongressAllowedAdminPath,
  isCongressOperator,
  usesCongressFocusedShell,
} from "../../src/lib/admin/nav-access";

describe("congress operator access", () => {
  it("el operador tiene control completo del congreso incluyendo finanzas", () => {
    const map = ROLE_PERMISSION_TEMPLATES[ROLE_CODES.CONGRESS_OPERATOR];
    assert.equal(map["congress.view"], true);
    assert.equal(map["congress.operate"], true);
    assert.equal(map["congress.payments"], true);
    assert.equal(map["congress.import"], true);
    assert.equal(map["congress.finance.correct"], true);
    assert.equal(map["student_affairs.panel.view"], false);
    assert.equal(map["growth.sales.view"], false);
  });

  it("restringe rutas al panel del congreso", () => {
    assert.equal(isCongressOperator([ROLE_CODES.CONGRESS_OPERATOR]), true);
    assert.equal(
      isCongressOperator([ROLE_CODES.CONGRESS_OPERATOR, ROLE_CODES.INSTITUTION_ADMIN]),
      false
    );
    assert.equal(usesCongressFocusedShell(["congress.view"], [ROLE_CODES.CONGRESS_OPERATOR]), true);
    assert.equal(
      isCongressAllowedAdminPath(
        "/admin/portal/forms/panel/ipn-asistencia-congreso-varones-2026"
      ),
      true
    );
    assert.equal(isCongressAllowedAdminPath("/admin/portal/congreso-varones"), true);
    assert.equal(isCongressAllowedAdminPath("/admin/portal/forms/panel"), false);
    assert.equal(isCongressAllowedAdminPath("/admin/portal/asuntos-estudiantiles"), false);
    assert.equal(isCongressAllowedAdminPath("/admin/ventas"), false);
  });
});
