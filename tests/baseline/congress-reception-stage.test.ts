import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";
import {
  arrivalMarksImmediately,
  deriveReceptionProgress,
  receptionPrimaryAction,
  type ReceptionStageRegistration,
} from "../../src/core/congress/reception-stage";

const ID = "reg-1";

function registration(
  patch: Partial<ReceptionStageRegistration> = {}
): ReceptionStageRegistration {
  return {
    identity: {
      fullName: "Hno Juan Pérez",
      rut: null,
      email: null,
      phone: "+56 9 1234 5678",
      status: "verified",
    },
    zoneId: "zona-1",
    churchName: "IPN Puente Alto",
    expectedDays: { saturday: true, sunday: true },
    attendance: { saturday: true, sunday: false },
    lodgingNeed: "none",
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
    needsReview: false,
    source: "form",
    submissionId: "sub-1",
    ...patch,
  };
}

describe("deriveReceptionProgress", () => {
  it("por confirmar queda en asistencia", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        expectedDays: { saturday: null, sunday: null },
        attendance: { saturday: false, sunday: false },
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.stage, "asistencia");
    assert.equal(progress.stageLabel, "En asistencia");
    assert.equal(progress.steps.asistencia, "ahora");
    assert.equal(progress.steps.alojamiento, "pendiente");
  });

  it("caso que incluye hoy sin llegada queda en asistencia", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: false, sunday: false },
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.arrivalRequired, true);
    assert.equal(progress.stage, "asistencia");
  });

  it("caso que excluye hoy no exige llegada de hoy", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        expectedDays: { saturday: true, sunday: false },
        attendance: { saturday: false, sunday: false },
        allocatedPaidClp: 0,
        lodgingNeed: "unknown",
      }),
      payments: [],
      assignments: [],
      journeyDay: "sunday",
    });
    assert.equal(progress.arrivalRequired, false);
    assert.equal(progress.stage, "alojamiento");
    assert.equal(progress.stageLabel, "En alojamiento");
  });

  it("falta teléfono, zona o iglesia aunque ya llegó", () => {
    for (const patch of [
      { identity: { ...registration().identity, phone: "" } },
      { identity: { ...registration().identity, phone: "123" } },
      { zoneId: "  " },
      { churchName: "" },
    ] as Partial<ReceptionStageRegistration>[]) {
      const progress = deriveReceptionProgress({
        registrationId: ID,
        registration: registration(patch),
        payments: [],
        assignments: [],
        journeyDay: "saturday",
      });
      assert.equal(progress.stage, "asistencia");
      assert.ok(progress.missingFields.length > 0);
    }
  });

  it("RUT y correo vacíos no bloquean", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: true },
        lodgingNeed: "none",
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.deepEqual(progress.missingFields, []);
    assert.equal(progress.stage, "listo");
  });

  it("el aporte no frena la recepción", () => {
    const pending = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        allocatedPaidClp: 0,
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(pending.stage, "listo");

    const partial = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        allocatedPaidClp: 1_000,
        lodgingNeed: "unknown",
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(partial.stage, "alojamiento");

    const review = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        needsReview: true,
        allocatedPaidClp: 0,
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(review.stage, "listo");
  });

  it("un pago, esté o no, deja el paso en alojamiento si falta la cama", () => {
    for (const payments of [
      [],
      [
        {
          status: "posted" as const,
          payerType: "individual" as const,
          allocations: [{ registrationId: ID, amountClp: CONGRESS_CONTRIBUTION_CLP }],
        },
      ],
      [
        {
          status: "posted" as const,
          payerType: "church" as const,
          allocations: [{ registrationId: ID, amountClp: CONGRESS_CONTRIBUTION_CLP }],
        },
      ],
    ]) {
      const progress = deriveReceptionProgress({
        registrationId: ID,
        registration: registration({
          attendance: { saturday: true, sunday: false },
          lodgingNeed: "unknown",
          allocatedPaidClp: payments.length === 0 ? CONGRESS_CONTRIBUTION_CLP : 0,
        }),
        payments,
        assignments: [],
        journeyDay: "saturday",
      });
      assert.equal(progress.stage, "alojamiento");
      assert.equal(progress.stageLabel, "En alojamiento");
    }
  });

  it("unknown y requested sin cama quedan en alojamiento", () => {
    for (const lodgingNeed of ["unknown", "requested"] as const) {
      const progress = deriveReceptionProgress({
        registrationId: ID,
        registration: registration({
          attendance: { saturday: true, sunday: false },
          lodgingNeed,
        }),
        payments: [],
        assignments: [],
        journeyDay: "saturday",
      });
      assert.equal(progress.stage, "alojamiento");
      assert.equal(progress.steps.alojamiento, "ahora");
    }
  });

  it("none y cama activa dejan alojamiento listo", () => {
    const none = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        lodgingNeed: "none",
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(none.stage, "listo");
    assert.equal(none.steps.alojamiento, "listo");
    assert.equal(none.steps.asistencia, "listo");

    const bed = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        lodgingNeed: "requested",
      }),
      payments: [],
      assignments: [
        { registrationId: ID, status: "assigned", confirmed: false },
      ],
      journeyDay: "saturday",
    });
    assert.equal(bed.stage, "listo");
  });

  it("llegada y cama dejan la ficha lista aunque el aporte siga pendiente", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        allocatedPaidClp: 0,
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.stage, "listo");
    assert.equal(progress.stageLabel, "Listo");
    assert.equal(progress.steps.asistencia, "listo");
    assert.equal(progress.steps.alojamiento, "listo");
  });
});

describe("receptionPrimaryAction", () => {
  it("siguiente avanza desde asistencia", () => {
    assert.deepEqual(
      receptionPrimaryAction("asistencia", {
        asistencia: "ahora",
        alojamiento: "pendiente",
      }),
      { label: "Siguiente", enabled: true, kind: "advance" }
    );
    assert.deepEqual(
      receptionPrimaryAction("asistencia", {
        asistencia: "listo",
        alojamiento: "pendiente",
      }),
      { label: "Siguiente", enabled: true, kind: "advance" }
    );
  });

  it("el último paso cierra la ficha solo si alojamiento está listo", () => {
    assert.deepEqual(
      receptionPrimaryAction("alojamiento", {
        asistencia: "listo",
        alojamiento: "ahora",
      }),
      { label: "Listo, siguiente de la fila", enabled: false, kind: "close" }
    );
    assert.deepEqual(
      receptionPrimaryAction("alojamiento", {
        asistencia: "listo",
        alojamiento: "listo",
      }),
      { label: "Listo, siguiente de la fila", enabled: true, kind: "close" }
    );
  });
});

describe("arrivalMarksImmediately", () => {
  const ready = {
    registrationId: ID,
    registration: registration({
      attendance: { saturday: false, sunday: false },
    }),
    payments: [],
    assignments: [],
    day: "saturday" as const,
  };

  it("marca en la fila si al llegar la ficha queda lista", () => {
    assert.equal(arrivalMarksImmediately(ready), true);
  });

  it("marca en la fila aunque falte el pago", () => {
    assert.equal(
      arrivalMarksImmediately({
        ...ready,
        registration: registration({
          attendance: { saturday: false, sunday: false },
          allocatedPaidClp: 0,
        }),
      }),
      true
    );
  });

  it("abre la guía si el alojamiento no está definido", () => {
    assert.equal(
      arrivalMarksImmediately({
        ...ready,
        registration: registration({
          attendance: { saturday: false, sunday: false },
          lodgingNeed: "unknown",
        }),
      }),
      false
    );
  });

  it("abre la guía si falta un dato o el caso de días", () => {
    assert.equal(
      arrivalMarksImmediately({
        ...ready,
        registration: registration({
          attendance: { saturday: false, sunday: false },
          identity: {
            fullName: "Hno Juan Pérez",
            rut: null,
            email: null,
            phone: "",
            status: "verified",
          },
        }),
      }),
      false
    );
    assert.equal(
      arrivalMarksImmediately({
        ...ready,
        registration: registration({
          attendance: { saturday: false, sunday: false },
          expectedDays: { saturday: null, sunday: null },
        }),
      }),
      false
    );
  });
});