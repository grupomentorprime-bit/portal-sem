import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  classifyProvisionResponse,
  provisionBodyConfirmsCompany,
  recoverExternalProvision,
} from "../../src/lib/connect/provision-state";

const TENANT = "espacio-sintetico";

describe("provisión externa", () => {
  it("un HTTP 200 incompleto no es activación", () => {
    assert.equal(provisionBodyConfirmsCompany(TENANT, null), false);
    assert.equal(provisionBodyConfirmsCompany(TENANT, { ok: true }), false);
    assert.equal(
      provisionBodyConfirmsCompany(TENANT, { ok: true, tenantId: "otro", created: true }),
      false
    );
    assert.equal(classifyProvisionResponse({ tenantId: TENANT, httpStatus: 200, body: null }), "uncertain");
    assert.equal(
      classifyProvisionResponse({ tenantId: TENANT, httpStatus: 200, body: { ok: true } }),
      "uncertain"
    );
    assert.equal(
      classifyProvisionResponse({ tenantId: TENANT, httpStatus: 204, body: "" }),
      "uncertain"
    );
  });

  it("solo confirma si el mismo Espacio fue creado o ya existía", () => {
    assert.equal(
      classifyProvisionResponse({
        tenantId: TENANT,
        httpStatus: 200,
        body: { ok: true, tenantId: TENANT, created: true },
      }),
      "activated"
    );
    assert.equal(
      classifyProvisionResponse({
        tenantId: TENANT,
        httpStatus: 200,
        body: { ok: true, tenantId: TENANT, existed: true },
      }),
      "activated"
    );
    assert.equal(classifyProvisionResponse({ tenantId: TENANT, httpStatus: null, body: null }), "failed");
    assert.equal(classifyProvisionResponse({ tenantId: TENANT, httpStatus: 500, body: { ok: false } }), "failed");
  });

  it("recuperar no vuelve a llamar al servicio", () => {
    for (const state of ["failed", "uncertain", "not_configured"] as const) {
      const plan = recoverExternalProvision({ state, httpStatus: state === "not_configured" ? null : 200, at: "2026-11-23T00:00:00.000Z" });
      assert.equal(plan.callExternal, false);
      assert.equal(plan.state, state);
      assert.equal(plan.reason, "not_idempotent");
    }
    assert.equal(
      recoverExternalProvision({
        state: "activated",
        httpStatus: 200,
        at: "2026-11-23T00:00:00.000Z",
      }).reason,
      "already_confirmed"
    );
    assert.equal(recoverExternalProvision(null).callExternal, false);
    assert.equal(recoverExternalProvision(undefined).reason, "not_requested");
  });

  it("el guardado del plan conserva la activación comercial y registra la provisión", () => {
    const src = readFileSync("src/app/api/platform/spaces/[tenantId]/apps/route.ts", "utf8");
    assert.match(src, /noteCommercialActivation/);
    assert.match(src, /writeSpaceContract/);
    assert.match(src, /recoverExternalProvision/);
    assert.match(src, /externalProvision/);
    assert.equal(src.includes("void provisionRrhhCompany"), false);
    assert.equal(src.includes("void provisionAprendeHoyCompany"), false);
    assert.equal(src.includes("response?.ok"), false);
    const rrhh = readFileSync("src/lib/connect/provision-rrhh.ts", "utf8");
    const aprende = readFileSync("src/lib/connect/provision-aprende-hoy.ts", "utf8");
    assert.match(rrhh, /\/api\/connect\/provision/);
    assert.match(aprende, /\/api\/connect\/provision/);
    assert.equal(rrhh.includes("response?.ok"), false);
    assert.equal(aprende.includes("response?.ok"), false);
  });
});
