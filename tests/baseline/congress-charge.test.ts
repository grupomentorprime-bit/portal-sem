import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyChargeChange, isExplicitlyExempt } from "../../src/core/congress/charge";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";

describe("applyChargeChange", () => {
  it("exenta con motivo y bloquea si hay imputado", () => {
    const blocked = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 1000,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.error, "has_allocations");

    const ok = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.chargeAmountClp, null);
    assert.equal(ok.chargeHistory.length, 1);
    assert.equal(ok.chargeHistory[0]?.action, "exempt");
  });

  it("idempotente si ya sin cargo; restore exige historial exempt", () => {
    const again = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [
        {
          action: "exempt",
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: null,
          reason: "Invitado",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
      action: "exempt",
      reason: "otra",
      nowIso: "2026-11-21T13:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.idempotent, true);
    assert.equal(again.chargeHistory.length, 1);

    const noHistory = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "restore",
      reason: "Error",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(noHistory.ok, false);
    if (noHistory.ok) return;
    assert.equal(noHistory.error, "not_exempt");

    const restored = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: again.chargeHistory,
      action: "restore",
      reason: "Debía pagar",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.chargeAmountClp, CONGRESS_CONTRIBUTION_CLP);
    assert.equal(restored.chargeHistory.at(-1)?.action, "restore");
  });

  it("exige motivo no vacío", () => {
    const r = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "  ",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.error, "reason_required");
  });
});

describe("isExplicitlyExempt", () => {
  it("distingue exento explícito de sin cargo", () => {
    assert.equal(
      isExplicitlyExempt({ chargeAmountClp: null, chargeHistory: [] }),
      false
    );
    assert.equal(
      isExplicitlyExempt({
        chargeAmountClp: null,
        chargeHistory: [
          {
            action: "exempt",
            previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
            nextChargeAmountClp: null,
            reason: "Staff",
            at: "2026-11-21T12:00:00.000Z",
            actorUserId: "u1",
          },
        ],
      }),
      true
    );
  });
});
