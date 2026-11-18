# Review package Task 2
Base: b023db1f5792813066e77d29ba205a1b9cdd920e
Head: ed0d606cd07db9a42a8c6bf4091e493ee3dae3cf

## Commits
ed0d606 feat(growth): apply embudo Admisión SEM sobre funnel default

## Stat
 src/core/growth/funnels.ts                 | 62 ++++++++++++++++++++++++++++++
 tests/baseline/sem-admision-funnel.test.ts | 26 +++++++++++++
 2 files changed, 88 insertions(+)

## Diff
```diff
diff --git a/src/core/growth/funnels.ts b/src/core/growth/funnels.ts
index 6b22d17..fa8efa1 100644
--- a/src/core/growth/funnels.ts
+++ b/src/core/growth/funnels.ts
@@ -9,20 +9,25 @@ import {
   definitionFromStages,
   freshFunnelStages,
   initialStageKey,
   intermediateStages,
   platformDefaultStages,
   stageLabel,
   stagesFromDefinition,
   validateNewStageKey,
 } from "./funnel-stages";
 import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
+import {
+  SEM_ADMISION_FUNNEL_NAME,
+  isSemAdmisionStages,
+  semAdmisionStages,
+} from "./sem-admision-funnel";
 import {
   GROWTH_FUNNEL_DEFAULT_KEY,
   GROWTH_FUNNEL_DEFAULT_NAME,
   growthOpportunityDefinitionKey,
   isGrowthFunnelResultKey,
   isGrowthFunnelSlug,
   type GrowthFunnel,
   type GrowthFunnelDefinition,
   type GrowthFunnelFailure,
   type GrowthFunnelStage,
@@ -67,20 +72,35 @@ export async function listGrowthFunnelStages(
 ): Promise<GrowthFunnelStage[] | null> {
   const funnel = await directory.findFunnel(tenantId, funnelKey);
   if (!funnel) return null;
   const definition = await directory.getDefinition(
     tenantId,
     funnel.workflowDefinitionKey
   );
   return stagesFromDefinition(definition);
 }
 
+export async function replaceGrowthFunnelStages(
+  directory: GrowthFunnelDirectory,
+  input: {
+    tenantId: string;
+    funnelKey: string;
+    stages: GrowthFunnelStage[];
+    now?: string;
+  }
+): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
+  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
+  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
+  const definition = await writeStages(directory, funnel, input.stages, nowIso(input.now));
+  return { ok: true, stages: stagesFromDefinition(definition) };
+}
+
 export async function growthFunnelInitialKeys(
   directory: GrowthFunnelDirectory,
   tenantId: string
 ): Promise<Record<string, string>> {
   const funnels = await directory.listFunnels(tenantId);
   const map: Record<string, string> = {};
   for (const funnel of funnels) {
     const definition = await directory.getDefinition(
       tenantId,
       funnel.workflowDefinitionKey
@@ -215,20 +235,62 @@ export async function renameGrowthFunnel(
   const name = input.name.trim();
   if (!name) return { ok: false, reason: "invalid_key" };
   const now = nowIso(input.now);
   const next = { ...funnel, name, updatedAt: now };
   await directory.saveFunnel(next);
   const stages = await listGrowthFunnelStages(directory, input.tenantId, input.key);
   if (stages) await writeStages(directory, next, stages, now);
   return { ok: true, funnel: next };
 }
 
+export async function applySemAdmisionDefaultFunnel(
+  directory: GrowthFunnelDirectory,
+  tenantId: string,
+  now?: string
+): Promise<{ funnel: GrowthFunnel; stages: GrowthFunnelStage[]; changed: boolean }> {
+  const at = nowIso(now);
+  const funnel = await ensureGrowthFunnelsForTenant(directory, tenantId, at);
+  let current = funnel;
+  let changed = false;
+
+  if (current.name !== SEM_ADMISION_FUNNEL_NAME) {
+    const renamed = await renameGrowthFunnel(directory, {
+      tenantId,
+      key: current.key,
+      name: SEM_ADMISION_FUNNEL_NAME,
+      now: at,
+    });
+    if (renamed.ok) {
+      current = renamed.funnel;
+      changed = true;
+    }
+  }
+
+  const existing = stagesFromDefinition(
+    await directory.getDefinition(tenantId, current.workflowDefinitionKey)
+  );
+  if (isSemAdmisionStages(existing)) {
+    return { funnel: current, stages: existing, changed };
+  }
+
+  const replaced = await replaceGrowthFunnelStages(directory, {
+    tenantId,
+    funnelKey: current.key,
+    stages: semAdmisionStages(),
+    now: at,
+  });
+  if (!replaced.ok) {
+    return { funnel: current, stages: existing, changed };
+  }
+  return { funnel: current, stages: replaced.stages, changed: true };
+}
+
 export async function archiveGrowthFunnel(
   directory: GrowthFunnelDirectory,
   input: { tenantId: string; key: string; now?: string }
 ): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFailure }> {
   const funnel = await directory.findFunnel(input.tenantId, input.key);
   if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
   if (funnel.isDefault) return { ok: false, reason: "default_required" };
   const open = await directory.countNonFinal(input.tenantId, funnel.key);
   if (open > 0) return { ok: false, reason: "open_opportunities" };
   const now = nowIso(input.now);
diff --git a/tests/baseline/sem-admision-funnel.test.ts b/tests/baseline/sem-admision-funnel.test.ts
index 2ae5c3e..b591c9f 100644
--- a/tests/baseline/sem-admision-funnel.test.ts
+++ b/tests/baseline/sem-admision-funnel.test.ts
@@ -1,20 +1,24 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 import {
   SEM_ADMISION_FUNNEL_NAME,
   isSemAdmisionStages,
   mapLegacyStatusToSemAdmision,
   semAdmisionIntermediateStages,
   semAdmisionStages,
 } from "../../src/core/growth/sem-admision-funnel";
+import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
+import { ensureGrowthFunnelsForTenant, applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
 import { platformDefaultStages } from "../../src/core/growth/funnel-stages";
+import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
+import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";
 
 describe("sem admision funnel", () => {
   it("define seis etapas con interes inicial y resultados de plataforma", () => {
     const stages = semAdmisionStages();
     const intermediates = stages.filter((s) => !s.isResult);
     assert.equal(SEM_ADMISION_FUNNEL_NAME, "Admisión");
     assert.deepEqual(
       intermediates.map((s) => s.key),
       ["interes", "contactado", "orientacion", "postulacion", "en-revision", "listo-matricular"]
     );
@@ -29,11 +33,33 @@ describe("sem admision funnel", () => {
   });
 
   it("remapea open→interes, otras intermedias→contactado, y no toca resultados ni etapas SEM", () => {
     assert.equal(mapLegacyStatusToSemAdmision("open"), "interes");
     assert.equal(mapLegacyStatusToSemAdmision("in_follow_up"), "contactado");
     assert.equal(mapLegacyStatusToSemAdmision("en-seguimiento"), "contactado");
     assert.equal(mapLegacyStatusToSemAdmision("won"), null);
     assert.equal(mapLegacyStatusToSemAdmision("interes"), null);
     assert.equal(mapLegacyStatusToSemAdmision("orientacion"), null);
   });
+
+  it("applySemAdmisionDefaultFunnel renombra default y deja etapas SEM; segunda pasada no cambia", async () => {
+    const directory = createMemoryFunnelDirectory();
+    await ensureGrowthFunnelsForTenant(directory, SEM_TENANT_ID, "2026-11-09T00:00:00.000Z");
+    const first = await applySemAdmisionDefaultFunnel(
+      directory,
+      SEM_TENANT_ID,
+      "2026-11-09T01:00:00.000Z"
+    );
+    assert.equal(first.changed, true);
+    assert.equal(first.funnel.name, "Admisión");
+    assert.equal(isSemAdmisionStages(first.stages), true);
+
+    const second = await applySemAdmisionDefaultFunnel(
+      directory,
+      SEM_TENANT_ID,
+      "2026-11-09T02:00:00.000Z"
+    );
+    assert.equal(second.changed, false);
+    const def = await directory.getDefinition(SEM_TENANT_ID, first.funnel.workflowDefinitionKey);
+    assert.equal(isSemAdmisionStages(stagesFromDefinition(def)), true);
+  });
 });

```
