import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";
import { labelExpectedDays } from "../../src/core/congress/expected-days";
import {
  deriveContributionStatus,
  isGroupPaymentSelectable,
} from "../../src/core/congress/finance-status";
import {
  assertLodgingNeedAllowed,
  isLodgingPending,
  resolveLodgingUiState,
} from "../../src/core/congress/lodging-status";

describe("expected days", () => {
  it("clasifica sábado, domingo, ambos y por confirmar", () => {
    assert.equal(labelExpectedDays({ saturday: true, sunday: false }), "saturday");
    assert.equal(labelExpectedDays({ saturday: false, sunday: true }), "sunday");
    assert.equal(labelExpectedDays({ saturday: true, sunday: true }), "both");
    assert.equal(labelExpectedDays({ saturday: null, sunday: null }), "unconfirmed");
    assert.equal(labelExpectedDays({ saturday: false, sunday: false }), "unconfirmed");
  });
});

describe("finance status", () => {
  it("no marca Pagado si saldo 0 pero needsReview", () => {
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      "needs_verification"
    );
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: false,
      }),
      "paid"
    );
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      "no_charge"
    );
  });
});

describe("group payment selectable", () => {
  const base = {
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    needsReview: false,
  };

  it("seleccionable si tiene saldo de cargo (pending, partial, verification con deuda)", () => {
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 0 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 5000 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: 0,
        needsReview: true,
      }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      false
    );
  });
});

describe("lodging ui status", () => {
  it("separa unknown, sin asignar, asignado y confirmado", () => {
    assert.equal(
      resolveLodgingUiState({ lodgingNeed: "unknown", assignment: null }).status,
      "unknown"
    );
    assert.equal(
      resolveLodgingUiState({ lodgingNeed: "none", assignment: null }).status,
      "none"
    );
    assert.equal(
      resolveLodgingUiState({ lodgingNeed: "requested", assignment: null }).status,
      "unassigned"
    );
    assert.equal(
      resolveLodgingUiState({
        lodgingNeed: "requested",
        assignment: { status: "assigned", confirmed: false },
      }).status,
      "assigned"
    );
    assert.equal(
      resolveLodgingUiState({
        lodgingNeed: "requested",
        assignment: { status: "confirmed", confirmed: true },
      }).status,
      "confirmed"
    );
  });

  it("filtro pendiente distingue motivos y rechaza none con asignación", () => {
    const u = resolveLodgingUiState({ lodgingNeed: "unknown", assignment: null });
    assert.equal(isLodgingPending(u), true);
    assert.equal(u.pendingReason, "unknown");
    const a = resolveLodgingUiState({
      lodgingNeed: "requested",
      assignment: { status: "assigned", confirmed: false },
    });
    assert.equal(isLodgingPending(a), true);
    assert.equal(a.pendingReason, "unconfirmed");
    assert.equal(
      assertLodgingNeedAllowed({ lodgingNeed: "none", hasActiveAssignment: true }).ok,
      false
    );
  });
});
