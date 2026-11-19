import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IPN_CHILE_VARONES } from "../../src/core/units/ipn-chile";
import { isCongressVaronesPlace } from "../../src/core/congress/place";

describe("lugar del congreso de varones", () => {
  it("solo existe en IPN Chile, departamento de varones", () => {
    assert.equal(
      isCongressVaronesPlace({ tenantId: "ipn-chile", unitIds: null }),
      true
    );
    assert.equal(
      isCongressVaronesPlace({
        tenantId: "ipn-chile",
        unitIds: [IPN_CHILE_VARONES.unitId],
      }),
      true
    );
    assert.equal(isCongressVaronesPlace({ tenantId: "cumple", unitIds: null }), false);
    assert.equal(
      isCongressVaronesPlace({ tenantId: "seminario-ipn", unitIds: null }),
      false
    );
    assert.equal(
      isCongressVaronesPlace({
        tenantId: "ipn-chile",
        unitIds: ["otro-departamento"],
      }),
      false
    );
  });
});
