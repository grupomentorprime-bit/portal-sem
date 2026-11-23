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

﻿### Task 2: Contrato de UI en fuente (copy y panel)

**Files:**
- Create: `tests/baseline/desktop-attention-ui.test.ts`
- Modify later in Tasks 3–4: `DesktopAttention.tsx`, `mentor-desktop.css`

**Interfaces:**
- Consumes: copy fijado en el spec
- Produces: red de seguridad para no regresar a «Elige una empresa» ni panel inline

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const src = () =>
  readFileSync(resolve(root, "src/components/desktop/DesktopAttention.tsx"), "utf8");
const css = () =>
  readFileSync(resolve(root, "src/components/desktop/mentor-desktop.css"), "utf8");

describe("Atención UI — Plataforma", () => {
  it("Nuevo ticket usa Seleccionar empresa y no Elige una empresa", () => {
    const text = src();
    assert.match(text, /Seleccionar empresa/);
    assert.doesNotMatch(text, /Elige una empresa/);
  });

  it("la ventana de Plataforma se titula Atención · Plataforma", () => {
    assert.match(src(), /Atención · Plataforma/);
  });

  it("Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS", () => {
    const text = src();
    assert.match(text, />Aplicar</);
    assert.match(text, />Limpiar</);
    assert.match(css(), /\.attn-filter-float/);
    assert.match(css(), /position:\s*absolute/);
  });

  it("Compose se remonta con composeSession", () => {
    assert.match(src(), /composeSession/);
    assert.match(src(), /key=\{composeSession\}/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: FAIL on missing strings / CSS class

---

