import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countAppliedDeskFilters,
  emptyDeskFilters,
} from "../../src/lib/desktop/help-origins";

describe("filtros de bandeja Atención (mesa)", () => {
  it("vacío cuenta 0", () => {
    assert.equal(countAppliedDeskFilters(emptyDeskFilters()), 0);
  });

  it("cuenta solo campos con valor", () => {
    assert.equal(
      countAppliedDeskFilters({
        tenantId: "mentor-prime-capacitacion",
        originId: "",
        status: "pendiente",
        priority: "",
        assigneeUserId: "u1",
      }),
      3
    );
  });

  it("emptyDeskFilters deja todos los campos en cadena vacía", () => {
    assert.deepEqual(emptyDeskFilters(), {
      tenantId: "",
      originId: "",
      status: "",
      priority: "",
      assigneeUserId: "",
    });
  });
});