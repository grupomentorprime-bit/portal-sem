### Task 1: Modelo puro SEM + remap

**Files:**
- Create: `src/core/growth/sem-admision-funnel.ts`
- Create: `tests/baseline/sem-admision-funnel.test.ts`
- Modify: `src/core/growth/index.ts` (solo si el barrel exporta módulos de funnels vecinos)

**Interfaces:**
- Consumes: `GROWTH_FUNNEL_RESULTS`, `GrowthFunnelStage`, `isGrowthFunnelResultKey` (`funnel-types`); `isGrowthOpportunityFinalStatus` (`opportunity-definition`).
- Produces:
  - `SEM_ADMISION_FUNNEL_NAME = "Admisión"`
  - `SEM_ADMISION_STAGE_KEYS` (tuple de 6 keys)
  - `semAdmisionIntermediateStages(): GrowthFunnelStage[]`
  - `semAdmisionStages(): GrowthFunnelStage[]` (intermedias + results)
  - `isSemAdmisionStages(stages: GrowthFunnelStage[]): boolean`
  - `mapLegacyStatusToSemAdmision(status: string): string | null` — `null` = no cambiar

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEM_ADMISION_FUNNEL_NAME,
  isSemAdmisionStages,
  mapLegacyStatusToSemAdmision,
  semAdmisionStages,
} from "../../src/core/growth/sem-admision-funnel";
import { platformDefaultStages } from "../../src/core/growth/funnel-stages";

describe("sem admision funnel", () => {
  it("define seis etapas con interes inicial y resultados de plataforma", () => {
    const stages = semAdmisionStages();
    const intermediates = stages.filter((s) => !s.isResult);
    assert.equal(SEM_ADMISION_FUNNEL_NAME, "Admisión");
    assert.deepEqual(
      intermediates.map((s) => s.key),
      ["interes", "contactado", "orientacion", "postulacion", "en-revision", "listo-matricular"]
    );
    assert.equal(intermediates.find((s) => s.isInitial)?.key, "interes");
    assert.ok(stages.some((s) => s.key === "won" && s.isResult));
    assert.equal(isSemAdmisionStages(stages), true);
    assert.equal(isSemAdmisionStages(platformDefaultStages()), false);
  });

  it("remapea open→interes, otras intermedias→contactado, y no toca resultados ni etapas SEM", () => {
    assert.equal(mapLegacyStatusToSemAdmision("open"), "interes");
    assert.equal(mapLegacyStatusToSemAdmision("in_follow_up"), "contactado");
    assert.equal(mapLegacyStatusToSemAdmision("en-seguimiento"), "contactado");
    assert.equal(mapLegacyStatusToSemAdmision("won"), null);
    assert.equal(mapLegacyStatusToSemAdmision("interes"), null);
    assert.equal(mapLegacyStatusToSemAdmision("orientacion"), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: FAIL (módulo no existe)

- [ ] **Step 3: Write minimal implementation**

```ts
// src/core/growth/sem-admision-funnel.ts
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import {
  GROWTH_FUNNEL_RESULTS,
  isGrowthFunnelResultKey,
  type GrowthFunnelStage,
} from "./funnel-types";

export const SEM_ADMISION_FUNNEL_NAME = "Admisión" as const;

export const SEM_ADMISION_STAGE_KEYS = [
  "interes",
  "contactado",
  "orientacion",
  "postulacion",
  "en-revision",
  "listo-matricular",
] as const;

export type SemAdmisionStageKey = (typeof SEM_ADMISION_STAGE_KEYS)[number];

const SEM_LABELS: Record<SemAdmisionStageKey, string> = {
  interes: "Interés",
  contactado: "Contactado",
  orientacion: "Orientación",
  postulacion: "Postulación",
  "en-revision": "En revisión",
  "listo-matricular": "Listo para matricular",
};

const SEM_KEY_SET = new Set<string>(SEM_ADMISION_STAGE_KEYS);

export function semAdmisionIntermediateStages(): GrowthFunnelStage[] {
  return SEM_ADMISION_STAGE_KEYS.map((key, position) => ({
    key,
    label: SEM_LABELS[key],
    position,
    active: true,
    isInitial: key === "interes",
    isResult: false,
  }));
}

export function semAdmisionStages(): GrowthFunnelStage[] {
  return [
    ...semAdmisionIntermediateStages(),
    ...GROWTH_FUNNEL_RESULTS.map((result) => ({
      key: result.key,
      label: result.label,
      position: 0,
      active: true,
      isInitial: false,
      isResult: true,
    })),
  ];
}

export function isSemAdmisionStages(stages: GrowthFunnelStage[]): boolean {
  const intermediates = stages
    .filter((stage) => !stage.isResult && !isGrowthFunnelResultKey(stage.key))
    .slice()
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
  if (intermediates.length !== SEM_ADMISION_STAGE_KEYS.length) return false;
  if (!intermediates.every((stage, index) => stage.key === SEM_ADMISION_STAGE_KEYS[index] && stage.active)) {
    return false;
  }
  return intermediates.find((stage) => stage.isInitial)?.key === "interes";
}

/** null = no cambiar (resultado, o ya es etapa SEM). */
export function mapLegacyStatusToSemAdmision(status: string): string | null {
  const key = status.trim();
  if (!key) return "interes";
  if (isGrowthOpportunityFinalStatus(key) || isGrowthFunnelResultKey(key)) return null;
  if (SEM_KEY_SET.has(key)) return null;
  if (key === "open") return "interes";
  return "contactado";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/growth/sem-admision-funnel.ts tests/baseline/sem-admision-funnel.test.ts src/core/growth/index.ts
git commit -m "feat(growth): modelo puro embudo Admisión SEM"
```

---
