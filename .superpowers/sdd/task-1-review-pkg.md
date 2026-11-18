# Review package Task 1
Base: 12ac89c8c80c1e10db94bbb5c7d50f3253cd1168
Head: b023db1f5792813066e77d29ba205a1b9cdd920e

## Commits
b023db1 fix(growth): validate result stages in isSemAdmisionStages
5de113c feat(growth): modelo puro embudo Admisión SEM

## Stat
 .superpowers/sdd/task-1-report.md          | 53 ++++++++++++++++++
 src/core/growth/index.ts                   |  9 +++
 src/core/growth/sem-admision-funnel.ts     | 90 ++++++++++++++++++++++++++++++
 tests/baseline/sem-admision-funnel.test.ts | 39 +++++++++++++
 4 files changed, 191 insertions(+)

## Diff
```diff
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
index 36556f1..a87e33b 100644
--- a/.superpowers/sdd/task-1-report.md
+++ b/.superpowers/sdd/task-1-report.md
@@ -1,10 +1,52 @@
+# Task 1 Report: Modelo puro SEM + remap
+
+## Goal
+Implement the pure SEM Admisión funnel helpers and the legacy status remap helper, with no UI or migration work.
+
+## What changed
+- Added `src/core/growth/sem-admision-funnel.ts`.
+- Added `tests/baseline/sem-admision-funnel.test.ts`.
+- Exported the new SEM Admisión helpers from `src/core/growth/index.ts`.
+
+## TDD Evidence
+
+### RED
+Test file added first:
+`tests/baseline/sem-admision-funnel.test.ts`
+
+Verified failure:
+- Command: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
+- Result: failed as expected with `Cannot find module '../../src/core/growth/sem-admision-funnel'`
+
+### GREEN
+Implemented the minimal helper module and barrel export:
+- `SEM_ADMISION_FUNNEL_NAME = "Admisión"`
+- `SEM_ADMISION_STAGE_KEYS` with the six SEM stages
+- `semAdmisionIntermediateStages()`
+- `semAdmisionStages()`
+- `isSemAdmisionStages()`
+- `mapLegacyStatusToSemAdmision()`
+
+Verified passing:
+- Command: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
+- Result: pass
+
+## Verification
+- Focused test file passed after implementation.
+- Lint diagnostics for edited files: no errors.
+
+## Commit
+- `5de113c` `feat(growth): modelo puro embudo Admisión SEM`
+
+## Notes
+- The worktree still has unrelated pre-existing modifications in `.superpowers/sdd/progress.md` and `.superpowers/sdd/task-1-brief.md`; դրանք were left untouched.
 # Task 1 — Núcleo puro y pruebas de aceptación
 
 Status: DONE_WITH_CONCERNS (decisiones de interpretación abajo)
 
 ## Commit
 - `37696a0` feat: calcular analítica de conversión desde el núcleo Growth (rama `feat/branding-admin-wip`)
 
 ## Archivos (solo estos tres en el commit)
 - `src/lib/growth/conversion-analytics.ts` (nuevo): `buildConversionAnalytics`, constantes `CONVERSION_DENOMINATORS`, `CONVERSION_RATE_NOTE`, `CONVERSION_LOSS_REASONS_NOTE`, todos los tipos del brief más `ConversionMovementRow`, `ConversionDwellRow`, `ConversionCycleStat`, `ConversionAnalyticsResponse`, y `medianOf`.
 - `src/lib/growth/index.ts`: reexporta función, constantes y tipos. El diff de este archivo contenía solo mis líneas.
@@ -29,10 +71,21 @@ Status: DONE_WITH_CONCERNS (decisiones de interpretación abajo)
 3. Historial incompleto, además de las causas del contrato: la `fromState` de una transición no coincide con la etapa anterior del recorrido (cadena rota), transición sin `occurredAt` válido, y no poder determinar la primera etapa (sin `payload.status` en la apertura ni transiciones). Una oportunidad sin ninguna actividad de apertura/transición cae en este cubo.
 4. `historialIncompleto`, `sinFechaApertura` y `sinFechaCierre` cuentan sobre todas las oportunidades del Espacio, no solo las del período.
 5. La etapa de un intervalo de permanencia que es un resultado no se mide. Si el `status` no es resultado y no hay `closedAt`, el intervalo cuenta en «en curso».
 
 ## Autorrevisión
 - Aislamiento por `tenantId` en oportunidades, actividades, embudos y campañas. No hay campo de motivo en la entrada. `lossReasonKey` no aparece en el archivo de producción (lo verifica un test).
 - Atribución de cierre con `closureOwnerUserId` del brief: nunca usa `ownerUserId` actual ni asignaciones posteriores. «Sin responsable» (abiertas) y «Sin atribución de responsable» (cierres) son filas distintas.
 - Archivadas: suman en captación y `archivedNow` (subconjunto, no corte extra); fuera de cohorte.
 - No se tocaron otros archivos, migración 029, git config, ni datos. Sin push.
 - Los archivos nuevos se guardaron con LF; git avisa que los convertirá a CRLF (comportamiento del repo en Windows).
+
+## Review Fix Notes
+- `isSemAdmisionStages()` now requires both the six SEM intermediates and the four platform result stages.
+- Added a regression test covering the intermediates-only case so the validator fails when result stages are missing.
+
+## Test Command
+- `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
+
+## Test Output
+- Initial run failed on `returns false for intermediates without result stages` with `true !== false`.
+- After the fix, the focused test suite passed: 3 tests, 0 failures.
diff --git a/src/core/growth/index.ts b/src/core/growth/index.ts
index a9f4004..1040183 100644
--- a/src/core/growth/index.ts
+++ b/src/core/growth/index.ts
@@ -67,20 +67,29 @@ export {
 
 export {
   GROWTH_OPPORTUNITY_DEFINITION_KEY,
   GROWTH_OPPORTUNITY_ENTITY_TYPE,
   GROWTH_OPPORTUNITY_FINAL_STATUSES,
   GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE,
   isGrowthOpportunityFinalStatus,
   listAvailableGrowthOpportunityTransitions,
 } from "./opportunity-definition";
 export type { GrowthOpportunityAvailableTransition } from "./opportunity-definition";
+export {
+  SEM_ADMISION_FUNNEL_NAME,
+  SEM_ADMISION_STAGE_KEYS,
+  isSemAdmisionStages,
+  mapLegacyStatusToSemAdmision,
+  semAdmisionIntermediateStages,
+  semAdmisionStages,
+} from "./sem-admision-funnel";
+export type { SemAdmisionStageKey } from "./sem-admision-funnel";
 export type { GrowthOpportunityStore } from "./opportunity-store";
 export type { GrowthOpportunityWorkflowPort } from "./opportunity-workflow-port";
 export {
   createMemoryGrowthOpportunityWorkflow,
 } from "./opportunity-workflow-port";
 export { createMemoryGrowthOpportunityStore } from "./opportunity-memory-store";
 export {
   createMongoGrowthOpportunityStore,
   openGrowthOpportunityStore,
 } from "./opportunity-repository";
diff --git a/src/core/growth/sem-admision-funnel.ts b/src/core/growth/sem-admision-funnel.ts
new file mode 100644
index 0000000..9c79168
--- /dev/null
+++ b/src/core/growth/sem-admision-funnel.ts
@@ -0,0 +1,90 @@
+import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
+import {
+  GROWTH_FUNNEL_RESULTS,
+  isGrowthFunnelResultKey,
+  type GrowthFunnelStage,
+} from "./funnel-types";
+
+export const SEM_ADMISION_FUNNEL_NAME = "Admisión" as const;
+
+export const SEM_ADMISION_STAGE_KEYS = [
+  "interes",
+  "contactado",
+  "orientacion",
+  "postulacion",
+  "en-revision",
+  "listo-matricular",
+] as const;
+
+export type SemAdmisionStageKey = (typeof SEM_ADMISION_STAGE_KEYS)[number];
+
+const SEM_LABELS: Record<SemAdmisionStageKey, string> = {
+  interes: "Interés",
+  contactado: "Contactado",
+  orientacion: "Orientación",
+  postulacion: "Postulación",
+  "en-revision": "En revisión",
+  "listo-matricular": "Listo para matricular",
+};
+
+const SEM_KEY_SET = new Set<string>(SEM_ADMISION_STAGE_KEYS);
+
+export function semAdmisionIntermediateStages(): GrowthFunnelStage[] {
+  return SEM_ADMISION_STAGE_KEYS.map((key, position) => ({
+    key,
+    label: SEM_LABELS[key],
+    position,
+    active: true,
+    isInitial: key === "interes",
+    isResult: false,
+  }));
+}
+
+export function semAdmisionStages(): GrowthFunnelStage[] {
+  return [
+    ...semAdmisionIntermediateStages(),
+    ...GROWTH_FUNNEL_RESULTS.map((result) => ({
+      key: result.key,
+      label: result.label,
+      position: 0,
+      active: true,
+      isInitial: false,
+      isResult: true,
+    })),
+  ];
+}
+
+export function isSemAdmisionStages(stages: GrowthFunnelStage[]): boolean {
+  const intermediates = stages
+    .filter((stage) => !stage.isResult && !isGrowthFunnelResultKey(stage.key))
+    .slice()
+    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
+  const results = stages
+    .filter((stage) => stage.isResult)
+    .slice();
+  if (intermediates.length !== SEM_ADMISION_STAGE_KEYS.length) return false;
+  if (
+    !intermediates.every(
+      (stage, index) => stage.key === SEM_ADMISION_STAGE_KEYS[index] && stage.active
+    )
+  ) {
+    return false;
+  }
+  if (
+    results.length !== GROWTH_FUNNEL_RESULTS.length ||
+    !results.every((stage, index) => stage.key === GROWTH_FUNNEL_RESULTS[index].key && stage.isResult)
+  ) {
+    return false;
+  }
+  return intermediates.find((stage) => stage.isInitial)?.key === "interes";
+}
+
+/** null = no cambiar (resultado, o ya es etapa SEM). */
+export function mapLegacyStatusToSemAdmision(status: string): string | null {
+  const key = status.trim();
+  if (!key) return "interes";
+  if (isGrowthOpportunityFinalStatus(key) || isGrowthFunnelResultKey(key)) return null;
+  if (SEM_KEY_SET.has(key)) return null;
+  if (key === "open") return "interes";
+  return "contactado";
+}
diff --git a/tests/baseline/sem-admision-funnel.test.ts b/tests/baseline/sem-admision-funnel.test.ts
new file mode 100644
index 0000000..2ae5c3e
--- /dev/null
+++ b/tests/baseline/sem-admision-funnel.test.ts
@@ -0,0 +1,39 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import {
+  SEM_ADMISION_FUNNEL_NAME,
+  isSemAdmisionStages,
+  mapLegacyStatusToSemAdmision,
+  semAdmisionIntermediateStages,
+  semAdmisionStages,
+} from "../../src/core/growth/sem-admision-funnel";
+import { platformDefaultStages } from "../../src/core/growth/funnel-stages";
+
+describe("sem admision funnel", () => {
+  it("define seis etapas con interes inicial y resultados de plataforma", () => {
+    const stages = semAdmisionStages();
+    const intermediates = stages.filter((s) => !s.isResult);
+    assert.equal(SEM_ADMISION_FUNNEL_NAME, "Admisión");
+    assert.deepEqual(
+      intermediates.map((s) => s.key),
+      ["interes", "contactado", "orientacion", "postulacion", "en-revision", "listo-matricular"]
+    );
+    assert.equal(intermediates.find((s) => s.isInitial)?.key, "interes");
+    assert.ok(stages.some((s) => s.key === "won" && s.isResult));
+    assert.equal(isSemAdmisionStages(stages), true);
+    assert.equal(isSemAdmisionStages(platformDefaultStages()), false);
+  });
+
+  it("returns false for intermediates without result stages", () => {
+    assert.equal(isSemAdmisionStages(semAdmisionIntermediateStages()), false);
+  });
+
+  it("remapea open→interes, otras intermedias→contactado, y no toca resultados ni etapas SEM", () => {
+    assert.equal(mapLegacyStatusToSemAdmision("open"), "interes");
+    assert.equal(mapLegacyStatusToSemAdmision("in_follow_up"), "contactado");
+    assert.equal(mapLegacyStatusToSemAdmision("en-seguimiento"), "contactado");
+    assert.equal(mapLegacyStatusToSemAdmision("won"), null);
+    assert.equal(mapLegacyStatusToSemAdmision("interes"), null);
+    assert.equal(mapLegacyStatusToSemAdmision("orientacion"), null);
+  });
+});

```
