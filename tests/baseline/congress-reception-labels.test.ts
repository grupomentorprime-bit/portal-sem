import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";
import { labelExpectedDays } from "../../src/core/congress/expected-days";
import {
  canExemptGroupMember,
  deriveContributionStatus,
  isGroupPaymentSelectable,
} from "../../src/core/congress/finance-status";
import {
  formatClp,
  groupRosterStatusText,
} from "../../src/components/admin/congress/labels";
import {
  countsAsPendingVerification,
  registrationOriginBucket,
} from "../../src/core/congress/form-engagement";
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

  it("la nómina sin formulario no queda por verificar hasta completar o actualizar", () => {
    const charge = {
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      needsReview: true,
    };
    assert.equal(countsAsPendingVerification({ ...charge, source: "import" }), false);
    assert.equal(
      deriveContributionStatus({ ...charge, source: "import" }),
      "pending"
    );
    assert.equal(
      countsAsPendingVerification({
        ...charge,
        source: "import",
        submissionId: "sub-1",
      }),
      true
    );
    assert.equal(
      deriveContributionStatus({
        ...charge,
        source: "import",
        submissionId: "sub-1",
      }),
      "needs_verification"
    );
    assert.equal(
      countsAsPendingVerification({ ...charge, source: "form", submissionId: "sub-2" }),
      true
    );
    assert.equal(
      countsAsPendingVerification({
        needsReview: false,
        source: "form",
        submissionId: "sub-3",
      }),
      false
    );
  });
});

describe("origen de inscripciones", () => {
  it("separa formulario nuevo, ficha actualizada y nómina sin tocar", () => {
    assert.equal(
      registrationOriginBucket({ source: "form", submissionId: "sub-1" }),
      "form"
    );
    assert.equal(
      registrationOriginBucket({ source: "import", submissionId: "sub-2" }),
      "updated"
    );
    assert.equal(registrationOriginBucket({ source: "import" }), "import");
    assert.equal(registrationOriginBucket({ source: "door" }), "door");
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

  it("la nómina muestra pagado, exento y abono, y solo exime sin pago", () => {
    const pending = {
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
    };
    assert.equal(canExemptGroupMember(pending), true);
    assert.equal(
      groupRosterStatusText(pending),
      `Pendiente · ${formatClp(CONGRESS_CONTRIBUTION_CLP)}`
    );
    assert.equal(
      canExemptGroupMember({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: 5000,
      }),
      false
    );
    assert.equal(
      groupRosterStatusText({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: 5000,
        chargeHistory: [],
      }),
      `Abono · saldo ${formatClp(CONGRESS_CONTRIBUTION_CLP - 5000)}`
    );
    assert.equal(
      groupRosterStatusText({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        chargeHistory: [],
      }),
      "Ya pagó"
    );
    assert.equal(
      canExemptGroupMember({ chargeAmountClp: null, allocatedPaidClp: 0 }),
      false
    );
    assert.equal(
      groupRosterStatusText({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        chargeHistory: [
          {
            action: "exempt",
            previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
            nextChargeAmountClp: null,
            reason: "Líder nacional",
            at: "2026-11-20T00:00:00.000Z",
            actorUserId: "u1",
          },
        ],
      }),
      "Exento · Líder nacional"
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
