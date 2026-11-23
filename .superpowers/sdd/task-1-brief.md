### Task 1: Etapa derivada

**Files:**
- Create: `src/core/congress/reception-stage.ts`
- Test: `tests/baseline/congress-reception-stage.test.ts`

﻿### Task 1: Helpers de filtros de mesa

**Files:**
- Modify: `src/lib/desktop/help-origins.ts` (tras `filterDeskCases`)
- Create or Modify: `tests/baseline/desktop-attention-filters.test.ts`

**Interfaces:**
- Consumes: `labelExpectedDays` (`src/core/congress/expected-days.ts`), `deriveContributionStatus` (`src/core/congress/finance-status.ts`), `isValidChilePhone` (`src/lib/experience/forms/phone-chile.ts`), `CongressAttendanceDay` (`src/core/congress/constants.ts`)
- Produces:

```ts
export type ReceptionStageId = "asistencia" | "alimentacion" | "alojamiento" | "listo";
export type ReceptionStepId = "asistencia" | "alimentacion" | "alojamiento";
export type ReceptionStepState = "ahora" | "pendiente" | "listo" | "bloqueado";
export type ReceptionMissingField = "fullName" | "phone" | "zoneId" | "churchName";
export type ReceptionFoodLock = "leader" | "paid" | "exempt" | null;

export type ReceptionProgress = {
  stage: ReceptionStageId;
  stageLabel: "En asistencia" | "En alimentación" | "En alojamiento" | "Listo";
  steps: Record<ReceptionStepId, ReceptionStepState>;
  missingFields: ReceptionMissingField[];
  arrivalRequired: boolean;
  foodLock: ReceptionFoodLock;
};

export function deriveReceptionProgress(input: {
  registration: ReceptionStageRegistration;
  payments: ReceptionStagePayment[];
  assignments: ReceptionStageAssignment[];
  journeyDay: CongressAttendanceDay;
}): ReceptionProgress;

export function receptionPrimaryAction(
  viewStep: ReceptionStepId,
  steps: ReceptionProgress["steps"]
): { label: "Siguiente" | "Listo, siguiente de la fila"; enabled: boolean; kind: "advance" | "close" };
```

`ReceptionStageRegistration` es un `Pick` de `CongressRegistration` con `identity`, `zoneId`, `churchName`, `expectedDays`, `attendance`, `lodgingNeed`, `chargeAmountClp`, `allocatedPaidClp`, `needsReview`, `source`, `submissionId`. El `_id` usado para pagos y camas va en el argumento: agregar `id: string` al input, no leer `_id` desde un Pick incompleto.

Firma final del input:

```ts
export function deriveReceptionProgress(input: {
  registrationId: string;
  registration: ReceptionStageRegistration;
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>;
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>;
  journeyDay: CongressAttendanceDay;
}): ReceptionProgress;
```

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/congress-reception-stage.test.ts` con este contenido:

  - `export type DeskFilterFields = { tenantId: string; originId: string; status: string; priority: string; assigneeUserId: string }`
  - `export function emptyDeskFilters(): DeskFilterFields`
  - `export function countAppliedDeskFilters(fields: DeskFilterFields): number`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-attention-filters.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";
import {
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
    assert.equal(progress.steps.alimentacion, "pendiente");
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
    assert.equal(progress.stage, "alimentacion");
    assert.equal(progress.stageLabel, "En alimentación");
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

  it("pending, partial y needs_verification quedan en alimentación", () => {
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
    assert.equal(pending.stage, "alimentacion");

    const partial = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        allocatedPaidClp: 1_000,
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(partial.stage, "alimentacion");
    assert.equal(partial.foodLock, null);

    const review = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        needsReview: true,
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(review.stage, "alimentacion");
  });

  it("paid individual no bloquea como líder", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        lodgingNeed: "unknown",
      }),
      payments: [
        {
          status: "posted",
          payerType: "individual",
          allocations: [{ registrationId: ID, amountClp: CONGRESS_CONTRIBUTION_CLP }],
        },
      ],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.foodLock, "paid");
    assert.equal(progress.steps.alimentacion, "listo");
    assert.equal(progress.stage, "alojamiento");
  });

  it("paid con pago church posted queda bloqueado", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        lodgingNeed: "unknown",
      }),
      payments: [
        {
          status: "posted",
          payerType: "church",
          allocations: [{ registrationId: ID, amountClp: CONGRESS_CONTRIBUTION_CLP }],
        },
      ],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.foodLock, "leader");
    assert.equal(progress.steps.alimentacion, "bloqueado");
    assert.equal(progress.stage, "alojamiento");
    assert.equal(progress.stageLabel, "En alojamiento");
  });

  it("pago church con saldo restante no cierra alimentación", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        allocatedPaidClp: 5_000,
      }),
      payments: [
        {
          status: "posted",
          payerType: "church",
          allocations: [{ registrationId: ID, amountClp: 5_000 }],
        },
      ],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.stage, "alimentacion");
    assert.equal(progress.foodLock, null);
    assert.equal(progress.steps.alimentacion, "ahora");
  });

  it("sin lista de pagos un paid no se marca como líder", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        lodgingNeed: "unknown",
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.foodLock, "paid");
    assert.equal(progress.steps.alimentacion, "listo");
  });

  it("exento deja alimentación lista", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        lodgingNeed: "unknown",
      }),
      payments: [],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.foodLock, "exempt");
    assert.equal(progress.stage, "alojamiento");
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
    assert.equal(none.steps.alimentacion, "listo");

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

  it("los tres listos con pago del líder marcan alimentación bloqueada", () => {
    const progress = deriveReceptionProgress({
      registrationId: ID,
      registration: registration({
        attendance: { saturday: true, sunday: false },
      }),
      payments: [
        {
          status: "posted",
          payerType: "church",
          allocations: [{ registrationId: ID, amountClp: CONGRESS_CONTRIBUTION_CLP }],
        },
      ],
      assignments: [],
      journeyDay: "saturday",
    });
    assert.equal(progress.stage, "listo");
    assert.equal(progress.stageLabel, "Listo");
    assert.equal(progress.steps.asistencia, "listo");
    assert.equal(progress.steps.alimentacion, "bloqueado");
    assert.equal(progress.steps.alojamiento, "listo");
  });
});

describe("receptionPrimaryAction", () => {
  it("siguiente espera a que el paso visible esté listo", () => {
    assert.deepEqual(
      receptionPrimaryAction("asistencia", {
        asistencia: "ahora",
        alimentacion: "pendiente",
        alojamiento: "pendiente",
      }),
      { label: "Siguiente", enabled: false, kind: "advance" }
    );
    assert.deepEqual(
      receptionPrimaryAction("asistencia", {
        asistencia: "listo",
        alimentacion: "ahora",
        alojamiento: "pendiente",
      }),
      { label: "Siguiente", enabled: true, kind: "advance" }
    );
    assert.deepEqual(
      receptionPrimaryAction("alimentacion", {
        asistencia: "listo",
        alimentacion: "bloqueado",
        alojamiento: "ahora",
      }),
      { label: "Siguiente", enabled: true, kind: "advance" }
    );
  });

  it("el último paso cierra la ficha solo si alojamiento está listo", () => {
    assert.deepEqual(
      receptionPrimaryAction("alojamiento", {
        asistencia: "listo",
        alimentacion: "listo",
        alojamiento: "ahora",
      }),
      { label: "Listo, siguiente de la fila", enabled: false, kind: "close" }
    );
    assert.deepEqual(
      receptionPrimaryAction("alojamiento", {
        asistencia: "listo",
        alimentacion: "bloqueado",
        alojamiento: "listo",
      }),
      { label: "Listo, siguiente de la fila", enabled: true, kind: "close" }
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/congress-reception-stage.test.ts`

Expected: FAIL. El módulo `reception-stage` no existe.

- [ ] **Step 3: Write minimal implementation**

Crear `src/core/congress/reception-stage.ts`:

```ts
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { labelExpectedDays } from "@/core/congress/expected-days";
import { deriveContributionStatus } from "@/core/congress/finance-status";
import type {
  CongressLodgingAssignment,
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import { isValidChilePhone } from "@/lib/experience/forms/phone-chile";

export type ReceptionStageId = "asistencia" | "alimentacion" | "alojamiento" | "listo";
export type ReceptionStepId = "asistencia" | "alimentacion" | "alojamiento";
export type ReceptionStepState = "ahora" | "pendiente" | "listo" | "bloqueado";
export type ReceptionMissingField = "fullName" | "phone" | "zoneId" | "churchName";
export type ReceptionFoodLock = "leader" | "paid" | "exempt" | null;

export type ReceptionStageRegistration = Pick<
  CongressRegistration,
  | "identity"
  | "zoneId"
  | "churchName"
  | "expectedDays"
  | "attendance"
  | "lodgingNeed"
  | "chargeAmountClp"
  | "allocatedPaidClp"
  | "needsReview"
  | "source"
  | "submissionId"
>;

export type ReceptionProgress = {
  stage: ReceptionStageId;
  stageLabel: "En asistencia" | "En alimentación" | "En alojamiento" | "Listo";
  steps: Record<ReceptionStepId, ReceptionStepState>;
  missingFields: ReceptionMissingField[];
  arrivalRequired: boolean;
  foodLock: ReceptionFoodLock;
};

const STEP_ORDER: ReceptionStepId[] = ["asistencia", "alimentacion", "alojamiento"];

const STAGE_LABEL: Record<ReceptionStageId, ReceptionProgress["stageLabel"]> = {
  asistencia: "En asistencia",
  alimentacion: "En alimentación",
  alojamiento: "En alojamiento",
  listo: "Listo",
};

function missingFields(reg: ReceptionStageRegistration): ReceptionMissingField[] {
  const missing: ReceptionMissingField[] = [];
  if (!reg.identity.fullName.trim()) missing.push("fullName");
  const phone = reg.identity.phone?.trim() ?? "";
  if (!phone || !isValidChilePhone(phone)) missing.push("phone");
  if (!reg.zoneId.trim()) missing.push("zoneId");
  if (!reg.churchName.trim()) missing.push("churchName");
  return missing;
}

function activeAssignment(
  registrationId: string,
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>
): boolean {
  return assignments.some(
    (assignment) =>
      assignment.registrationId === registrationId &&
      assignment.status !== "cancelled" &&
      (assignment.status === "assigned" ||
        assignment.status === "confirmed" ||
        assignment.confirmed)
  );
}

function leaderPaid(
  registrationId: string,
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>
): boolean {
  return payments.some(
    (payment) =>
      payment.status === "posted" &&
      payment.payerType === "church" &&
      payment.allocations.some(
        (allocation) =>
          allocation.registrationId === registrationId && allocation.amountClp > 0
      )
  );
}

export function deriveReceptionProgress(input: {
  registrationId: string;
  registration: ReceptionStageRegistration;
  payments: Array<Pick<CongressPayment, "status" | "payerType" | "allocations">>;
  assignments: Array<Pick<CongressLodgingAssignment, "registrationId" | "status" | "confirmed">>;
  journeyDay: CongressAttendanceDay;
}): ReceptionProgress {
  const expected = labelExpectedDays(input.registration.expectedDays);
  const caseClear = expected !== "unconfirmed";
  const arrivalRequired = caseClear && (expected === "both" || expected === input.journeyDay);
  const arrived = input.registration.attendance[input.journeyDay] === true;
  const missing = missingFields(input.registration);
  const attendanceReady = caseClear && missing.length === 0 && (!arrivalRequired || arrived);

  const contribution = deriveContributionStatus(input.registration);
  const foodReady = contribution === "paid" || contribution === "no_charge";
  const foodLock: ReceptionFoodLock = !foodReady
    ? null
    : contribution === "no_charge"
      ? "exempt"
      : leaderPaid(input.registrationId, input.payments)
        ? "leader"
        : "paid";

  const hasBed = activeAssignment(input.registrationId, input.assignments);
  const lodgingNeed = input.registration.lodgingNeed ?? "unknown";
  const lodgingReady = hasBed || (lodgingNeed === "none" && !hasBed);

  const stage: ReceptionStageId = !attendanceReady
    ? "asistencia"
    : !foodReady
      ? "alimentacion"
      : !lodgingReady
        ? "alojamiento"
        : "listo";

  const stageIndex = stage === "listo" ? STEP_ORDER.length : STEP_ORDER.indexOf(stage);
  const steps = {} as ReceptionProgress["steps"];
  for (const step of STEP_ORDER) {
    const stepIndex = STEP_ORDER.indexOf(step);
    if (stepIndex > stageIndex) {
      steps[step] = "pendiente";
      continue;
    }
    if (stepIndex < stageIndex || stage === "listo") {
      steps[step] = step === "alimentacion" && foodLock === "leader" ? "bloqueado" : "listo";
      continue;
    }
    steps[step] = "ahora";
  }

  return {
    stage,
    stageLabel: STAGE_LABEL[stage],
    steps,
    missingFields: missing,
    arrivalRequired,
    foodLock,
  };
}

export function receptionPrimaryAction(
  viewStep: ReceptionStepId,
  steps: ReceptionProgress["steps"]
): { label: "Siguiente" | "Listo, siguiente de la fila"; enabled: boolean; kind: "advance" | "close" } {
  if (viewStep === "alojamiento") {
    return {
      label: "Listo, siguiente de la fila",
      enabled: steps.alojamiento === "listo",
      kind: "close",
    };
  }
  const state = steps[viewStep];
  return {
    label: "Siguiente",
    enabled: state === "listo" || state === "bloqueado",
    kind: "advance",
  };

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: FAIL (exports missing)

- [ ] **Step 3: Write minimal implementation**

In `src/lib/desktop/help-origins.ts`, after `filterDeskCases`:

```ts
export type DeskFilterFields = {
  tenantId: string;
  originId: string;
  status: string;
  priority: string;
  assigneeUserId: string;
};

export function emptyDeskFilters(): DeskFilterFields {
  return {
    tenantId: "",
    originId: "",
    status: "",
    priority: "",
    assigneeUserId: "",
  };
}

export function countAppliedDeskFilters(fields: DeskFilterFields): number {
  return [
    fields.tenantId,
    fields.originId,
    fields.status,
    fields.priority,
    fields.assigneeUserId,
  ].filter(Boolean).length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-reception-stage.test.ts`

Expected: PASS. Todos los `it` de ese archivo en verde.

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: PASS
---

