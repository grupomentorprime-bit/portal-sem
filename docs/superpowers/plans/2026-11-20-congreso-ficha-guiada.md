# Ficha guiada de recepción — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recorrer la ficha del participante en tres pasos, con un distintivo fijo de la etapa, y no cerrar la fila hasta que asistencia, alimentación y alojamiento estén listos.

**Architecture:** Una función pura (`deriveReceptionProgress`) decide la etapa con la inscripción, los pagos ya cargados, las camas y el día de jornada. La ficha y el listado la consumen. No hay campo nuevo ni endpoint nuevo. El distintivo vive fuera del scroll; **Siguiente** solo cambia el paso visible.

**Tech Stack:** TypeScript, Next.js, `node:test` vía `npx tsx --test`, componentes admin existentes (`Dialog`, `Button`, `Input`, `Select`).

**Spec:** `docs/superpowers/specs/2026-11-20-congreso-ficha-guiada-design.md`

## Global Constraints

- Sin endpoint nuevo, sin campo nuevo en la base, sin filtro nuevo, sin cambios a la pantalla de Pago grupal.
- La etapa se deriva en el cliente. La X de la ficha solo llama `onClose`.
- Día de jornada: el `journeyDay` ya seleccionado en Recepción (`saturday` | `sunday`). La ficha no elige otro.
- Datos que bloquean asistencia: nombre con texto, teléfono que pase `isValidChilePhone`, zona e iglesia con texto. RUT y correo no bloquean.
- Llegada del día de jornada se exige solo si el caso (`labelExpectedDays`) incluye ese día.
- Alimentación lista si `deriveContributionStatus` es `paid` o `no_charge`. `pending`, `partial` y `needs_verification` no cierran el paso.
- Bloqueo del líder: estado `paid` y al menos un pago `status === "posted"`, `payerType === "church"`, con imputación `amountClp > 0` a esta inscripción. Texto del paso: **Pagado por el líder**. Sin cobro, exención ni abono.
- `paid` sin ese pago de iglesia: **Pagado**, sin bloqueo. Sin la lista de pagos, un `paid` queda en ese caso.
- Exento (`no_charge`): alimentación lista. Restaurar aporte sigue disponible.
- Alojamiento lista con asignación activa (`status !== "cancelled"` y (`status === "assigned"` o `status === "confirmed"` o `confirmed`)) o con `lodgingNeed === "none"` sin asignación activa.
- Distintivo: **En asistencia**, **En alimentación**, **En alojamiento**, **Listo**.
- Botón: **Siguiente** en asistencia y alimentación; **Listo, siguiente de la fila** en alojamiento. Deshabilitado si el paso visible no está listo o `busy`.
- Quien no tiene `operate` ve el distintivo y no ve el botón ni acciones de cambio.
- Copys de llegada, RUT y teléfono existentes no se reemplazan por validadores nuevos.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/reception-stage.ts` | Etapa, estados de paso, campos faltantes, botón principal |
| `tests/baseline/congress-reception-stage.test.ts` | Casos de la spec |
| `src/components/admin/congress/participant/ReceptionStageHeader.tsx` | Distintivo, tres pasos, botón principal |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | Paso visible, orden de asistencia, candado de alimentación, botones de cama |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Pasar `journeyDay` a la ficha |
| `src/components/admin/congress/reception/ReceptionView.tsx` | El mismo texto del distintivo bajo el nombre |

---

### Task 1: Etapa derivada

**Files:**
- Create: `src/core/congress/reception-stage.ts`
- Test: `tests/baseline/congress-reception-stage.test.ts`

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
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-reception-stage.test.ts`

Expected: PASS. Todos los `it` de ese archivo en verde.

---

### Task 2: Distintivo

**Files:**
- Create: `src/components/admin/congress/participant/ReceptionStageHeader.tsx`
- Consumes: `ReceptionProgress`, `ReceptionStepId`, `receptionPrimaryAction` de Task 1

**Interfaces:**
- Produces: `ReceptionStageHeader` con props

```ts
type Props = {
  progress: ReceptionProgress;
  viewStep: ReceptionStepId;
  operate: boolean;
  busy: boolean;
  onViewStep: (step: ReceptionStepId) => void;
  onPrimary: () => void;
};
```

- [ ] **Step 1: Create the header**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  receptionPrimaryAction,
  type ReceptionProgress,
  type ReceptionStepId,
} from "@/core/congress/reception-stage";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<ReceptionStepId, string> = {
  asistencia: "Asistencia",
  alimentacion: "Alimentación",
  alojamiento: "Alojamiento",
};

const STATE_LABEL = {
  ahora: "Ahora",
  pendiente: "Pendiente",
  listo: "Listo",
  bloqueado: "Bloqueado",
} as const;

type Props = {
  progress: ReceptionProgress;
  viewStep: ReceptionStepId;
  operate: boolean;
  busy: boolean;
  onViewStep: (step: ReceptionStepId) => void;
  onPrimary: () => void;
};

export function ReceptionStageHeader({
  progress,
  viewStep,
  operate,
  busy,
  onViewStep,
  onPrimary,
}: Props) {
  const action = receptionPrimaryAction(viewStep, progress.steps);
  const steps = Object.keys(STEP_LABEL) as ReceptionStepId[];

  return (
    <div className="space-y-3">
      <p
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-sm font-extrabold",
          progress.stage === "listo"
            ? "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] text-[var(--growth-os-success)]"
            : "bg-primary text-text-inverse"
        )}
        role="status"
      >
        {progress.stageLabel}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => {
          const state = progress.steps[step];
          const openable = state !== "pendiente";
          return (
            <button
              key={step}
              type="button"
              disabled={!openable}
              onClick={() => {
                if (!openable) return;
                onViewStep(step);
              }}
              className={cn(
                "rounded-md border px-2 py-2 text-left",
                viewStep === step ? "border-primary" : "border-border",
                !openable && "opacity-50"
              )}
            >
              <span className="block text-sm font-semibold">{STEP_LABEL[step]}</span>
              <span className="block text-xs text-muted">{STATE_LABEL[state]}</span>
            </button>
          );
        })}
      </div>
      {operate ? (
        <Button type="button" disabled={busy || !action.enabled} onClick={onPrimary}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo que mencione `ReceptionStageHeader.tsx`. Si `tsc` ya falla en archivos ajenos, el error no debe nombrar este archivo.

---

### Task 3: La ficha usa la etapa

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (el único `<ParticipantSheet>`)

**Interfaces:**
- Consumes: `deriveReceptionProgress`, `receptionPrimaryAction`, `ReceptionStepId`, `ReceptionStageHeader`
- Produces: prop nueva `journeyDay: CongressAttendanceDay` en `ParticipantSheet`

- [ ] **Step 1: Pasar el día de jornada**

En `Props` de `ParticipantSheet`, junto a `operate`:

```ts
journeyDay: CongressAttendanceDay;
```

Importar el tipo desde `@/core/congress/constants` (el archivo ya importa `CongressAttendanceDay`).

En `CongressOpsPanel.tsx`, dentro de `<ParticipantSheet>`:

```tsx
journeyDay={journeyDay}
```

- [ ] **Step 2: Calcular el progreso y el paso visible**

Dentro de `ParticipantSheet`, después de los `useMemo` existentes y cuando `registration` existe, calcular:

```ts
const progress = useMemo(() => {
  if (!registration) return null;
  return deriveReceptionProgress({
    registrationId: registration._id,
    registration,
    payments,
    assignments,
    journeyDay,
  });
}, [registration, payments, assignments, journeyDay]);
```

Reemplazar el estado `tab` / `setTab` por:

```ts
const [viewStep, setViewStep] = useState<ReceptionStepId>("asistencia");
const [viewForId, setViewForId] = useState<string | null>(null);
if (registration && progress && viewForId !== registration._id) {
  setViewForId(registration._id);
  setViewStep(progress.stage === "listo" ? "alojamiento" : progress.stage);
}
```

Ese ajuste corre durante el render solo cuando cambia la persona. Completar un paso no salta el contenido: el distintivo cambia y **Siguiente** pasa a habilitado.

Borrar el array `tabs` y la fila de botones que hace `setTab`. En su lugar, fuera de `div.max-h-[min(60vh,32rem)]` y antes del banner de formulario, renderizar:

```tsx
{progress ? (
  <ReceptionStageHeader
    progress={progress}
    viewStep={viewStep}
    operate={operate}
    busy={busy}
    onViewStep={setViewStep}
    onPrimary={() => {
      const action = receptionPrimaryAction(viewStep, progress.steps);
      if (!action.enabled || busy) return;
      if (action.kind === "close") {
        onClose();
        return;
      }
      setViewStep(viewStep === "asistencia" ? "alimentacion" : "alojamiento");
    }}
  />
) : null}
```

`onClose` sigue siendo el único efecto de la X del `Dialog`. No escribir etapa al cerrar.

Reemplazar cada `tab === "asistencia"`, `tab === "alimentacion"` y `tab === "alojamiento"` por `viewStep === ...`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx` ni `CongressOpsPanel.tsx`.

---

### Task 4: Asistencia en orden de fila

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (el bloque `viewStep === "asistencia"`)

**Interfaces:**
- Consumes: `progress.missingFields`, `progress.arrivalRequired`, `journeyDay`

- [ ] **Step 1: Subir llegada y caso de días**

Al inicio del contenido de asistencia, antes de "Datos del inscrito", dejar este orden:

1. Tarjeta del `journeyDay` primero. En el `.map` de `saturday` / `sunday`, ordenar con el día de jornada al inicio:

```ts
const attendanceDays = (
  journeyDay === "sunday" ? (["sunday", "saturday"] as const) : (["saturday", "sunday"] as const)
);
```

El botón **Llegada** del día de jornada usa el `Button` sin `size="sm"`. **Ausente** y **Sin marcar** siguen `size="sm"` `variant="outline"` y `variant="ghost"`, con los mismos `onPatchAttendance` de hoy.

2. Caso de días, tres botones, en lugar del `Select` "Confirmar asistencia". Conservar el texto "Previsto: …". Cada botón llama el mismo `onPatchRegistration` que el select:

```tsx
<div className="flex flex-wrap gap-2">
  {(
    [
      ["saturday", "Sábado", { saturday: true, sunday: false }],
      ["sunday", "Domingo", { saturday: false, sunday: true }],
      ["both", "Ambos", { saturday: true, sunday: true }],
    ] as const
  ).map(([id, label, expectedDays]) => (
    <Button
      key={id}
      type="button"
      size="sm"
      variant={expectedPreset === id ? "primary" : "outline"}
      disabled={busy || !operate}
      onClick={() => {
        setExpectedPreset(id);
        void onPatchRegistration(registration._id, { expectedDays });
      }}
    >
      {label}
    </Button>
  ))}
</div>
```

Quitar el `Select` de "Confirmar asistencia". El preset `unconfirmed` no tiene botón: si `expectedPreset === "unconfirmed"`, ninguno se ve activo.

- [ ] **Step 2: Pedir solo los datos que faltan**

Extraer el `onClick` actual de **Guardar datos** a una función `saveIdentity` en el cuerpo del componente. Si `registration` es null, salir. La función conserva la validación de RUT y teléfono y el mismo `onPatchRegistration`.

Si `progress.missingFields` tiene elementos, mostrar arriba del formulario una caja "Faltan datos" con un control por campo faltante, reusando `editName`, `editPhone`, `editZone`, `editChurch` y `saveIdentity`. Esos campos no se repiten en la grilla de abajo.

La grilla de abajo muestra los datos que ya están (los que no están en `missingFields`) más RUT, correo y los dos checkboxes de líder. Esos no bloquean el botón del distintivo: el habilitado sale de `receptionPrimaryAction`, no de esta caja.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

### Task 5: Alimentación pagada por el líder

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alimentacion"`)

**Interfaces:**
- Consumes: `progress.foodLock`

- [ ] **Step 1: Reemplazar el cobro cuando el líder ya pagó**

Cuando `progress.foodLock === "leader"`, no renderizar el formulario de pago, la exención ni el abono (`canPay && operate && registration.chargeAmountClp != null`). En su lugar:

```tsx
<div className="rounded-md border border-border bg-background-soft/40 px-3 py-3" role="status">
  <p className="text-base font-extrabold">Pagado por el líder</p>
  <p className="text-sm text-muted">
    Imputado {formatClp(registration.allocatedPaidClp)}
  </p>
</div>
```

Dejar visibles la etiqueta `contributionLabel` y el historial. Con `foodLock === "exempt"` o `"paid"`, la UI de alimentación queda como está hoy (exento puede restaurar; pagado individual no ofrece otro cobro si el saldo ya es 0).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

### Task 6: Alojamiento en dos respuestas

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alojamiento"`)

- [ ] **Step 1: Botones antes del selector**

Si `operate` y `(registration.lodgingNeed ?? "unknown") === "unknown"`, encima del `Select` "Necesidad":

```tsx
<div className="flex flex-wrap gap-2">
  <Button
    type="button"
    disabled={busy}
    onClick={() =>
      void onPatchRegistration(registration._id, { lodgingNeed: "none" })
    }
  >
    No requiere
  </Button>
  <Button
    type="button"
    variant="outline"
    disabled={busy}
    onClick={() =>
      void onPatchRegistration(registration._id, { lodgingNeed: "requested" })
    }
  >
    Necesita cama
  </Button>
</div>
```

El `Select` y el formulario de hogar existentes se mantienen. `Necesita cama` deja `lodgingNeed` en `requested`, y el formulario de asignación que ya exige `!== "none"` aparece solo.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

### Task 7: Distintivo en la fila

**Files:**
- Modify: `src/components/admin/congress/reception/ReceptionView.tsx`

**Interfaces:**
- Consumes: `deriveReceptionProgress` y `journeyDay` (la vista ya lo recibe). Pagos: pasar `[]`. El texto del listado es `stageLabel`, y un `paid` sin pagos cargados no necesita el candado del líder para decir **Listo** o **En alojamiento**.

- [ ] **Step 1: Mostrar la etapa bajo el nombre**

Dentro de `ReceptionView`, un mapa memorizado:

```ts
const stageLabelById = useMemo(() => {
  const labels = new Map<string, string>();
  for (const reg of registrations) {
    labels.set(
      reg._id,
      deriveReceptionProgress({
        registrationId: reg._id,
        registration: reg,
        payments: [],
        assignments,
        journeyDay,
      }).stageLabel
    );
  }
  return labels;
}, [registrations, assignments, journeyDay]);
```

En la celda de escritorio, bajo `registrationDisplayName(reg)` y antes del teléfono:

```tsx
<p className="text-xs font-extrabold text-primary">{stageLabelById.get(reg._id)}</p>
```

En la tarjeta móvil, el mismo `<p>` bajo el nombre y antes del aviso de formulario.

- [ ] **Step 2: Verificar dominio y tipos**

Run: `npx tsx --test tests/baseline/congress-reception-stage.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ReceptionView.tsx`.
