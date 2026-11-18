# Review package Task 3
Base: ed0d606cd07db9a42a8c6bf4091e493ee3dae3cf
Head: 7ac62a495881451547a2fcc64a2627de0f701548

## Commits
7ac62a4 feat(growth): migración 030 embudo Admisión SEM

## Stat
 src/core/growth/sem-admision-funnel.ts         | 12 ++++++
 src/core/migrations/030-sem-admision-funnel.ts | 55 ++++++++++++++++++++++++++
 src/core/migrations/registry.ts                |  2 +
 tests/baseline/sem-admision-funnel.test.ts     | 14 +++++++
 4 files changed, 83 insertions(+)

## Diff
```diff
diff --git a/src/core/growth/sem-admision-funnel.ts b/src/core/growth/sem-admision-funnel.ts
index 9c79168..b8fe1e0 100644
--- a/src/core/growth/sem-admision-funnel.ts
+++ b/src/core/growth/sem-admision-funnel.ts
@@ -81,10 +81,22 @@ export function isSemAdmisionStages(stages: GrowthFunnelStage[]): boolean {
 
 /** null = no cambiar (resultado, o ya es etapa SEM). */
 export function mapLegacyStatusToSemAdmision(status: string): string | null {
   const key = status.trim();
   if (!key) return "interes";
   if (isGrowthOpportunityFinalStatus(key) || isGrowthFunnelResultKey(key)) return null;
   if (SEM_KEY_SET.has(key)) return null;
   if (key === "open") return "interes";
   return "contactado";
 }
+
+export function planSemAdmisionStatusRemaps(
+  rows: Array<{ _id: string; status: string }>
+): Array<{ id: string; from: string; to: string }> {
+  const out: Array<{ id: string; from: string; to: string }> = [];
+  for (const row of rows) {
+    const to = mapLegacyStatusToSemAdmision(row.status);
+    if (!to || to === row.status) continue;
+    out.push({ id: row._id, from: row.status, to });
+  }
+  return out;
+}
diff --git a/src/core/migrations/030-sem-admision-funnel.ts b/src/core/migrations/030-sem-admision-funnel.ts
new file mode 100644
index 0000000..3660cba
--- /dev/null
+++ b/src/core/migrations/030-sem-admision-funnel.ts
@@ -0,0 +1,55 @@
+import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
+import { applySemAdmisionDefaultFunnel } from "@/core/growth/funnels";
+import { GROWTH_OPORTUNIDADES_COLLECTION } from "@/core/growth/types";
+import { GROWTH_OPPORTUNITY_ENTITY_TYPE } from "@/core/growth/opportunity-definition";
+import { planSemAdmisionStatusRemaps } from "@/core/growth/sem-admision-funnel";
+import type { MigrationDefinition } from "@/core/migrations/types";
+import { SEM_TENANT_ID } from "@/core/tenant/constants";
+
+export const migration030SemAdmisionFunnel: MigrationDefinition = {
+  id: "030-sem-admision-funnel",
+  description: "Embudo Admisión SEM: etapas, rename default y remap de status abiertos",
+  modules: [],
+
+  async run({ db, log }) {
+    const directory = createMongoGrowthFunnelDirectory(db);
+    const applied = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID);
+    log(`funnel name=${applied.funnel.name} changed=${applied.changed}`);
+
+    const opps = await db
+      .collection(GROWTH_OPORTUNIDADES_COLLECTION)
+      .find({ tenantId: SEM_TENANT_ID }, { projection: { _id: 1, status: 1 } })
+      .toArray();
+    const plan = planSemAdmisionStatusRemaps(
+      opps.map((row) => ({ _id: String(row._id), status: String(row.status ?? "") }))
+    );
+
+    let remapped = 0;
+    for (const item of plan) {
+      await db.collection(GROWTH_OPORTUNIDADES_COLLECTION).updateOne(
+        { tenantId: SEM_TENANT_ID, _id: item.id },
+        { $set: { status: item.to } }
+      );
+      await db.collection("workflow_instances").updateOne(
+        {
+          tenantId: SEM_TENANT_ID,
+          entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
+          entityId: item.id,
+        },
+        { $set: { currentState: item.to } }
+      );
+      remapped += 1;
+      log(`remap opp=${item.id} ${item.from}->${item.to}`);
+    }
+
+    return {
+      documentsAffected: Number(applied.changed) + remapped,
+      skipped: opps.length - remapped,
+      details: [
+        `funnelChanged=${applied.changed}`,
+        `remapped=${remapped}`,
+        `opps=${opps.length}`,
+      ],
+    };
+  },
+};
diff --git a/src/core/migrations/registry.ts b/src/core/migrations/registry.ts
index 82c6919..40f3189 100644
--- a/src/core/migrations/registry.ts
+++ b/src/core/migrations/registry.ts
@@ -19,20 +19,21 @@ import { migration018GrowthMessaging } from "@/core/migrations/018-growth-messag
 import { migration019GrowthWhatsApp } from "@/core/migrations/019-growth-whatsapp";
 import { migration020GrowthWhatsAppOutbound } from "@/core/migrations/020-growth-whatsapp-outbound";
 import { migration021GrowthCampaigns } from "@/core/migrations/021-growth-campaigns";
 import { migration022GrowthAnalytics } from "@/core/migrations/022-growth-analytics";
 import { migration023GrowthTeamMembershipUnique } from "@/core/migrations/023-growth-team-membership-unique";
 import { migration024GrowthStartupNextAction } from "@/core/migrations/024-growth-startup-next-action";
 import { migration025PlatformDefaultDomains } from "@/core/migrations/025-platform-default-domains";
 import { migration026PlatformWildcardSubdomains } from "@/core/migrations/026-platform-wildcard-subdomains";
 import { migration027StripForeignSemAssets } from "@/core/migrations/027-strip-foreign-sem-assets";
 import { migration028GrowthFunnels } from "@/core/migrations/028-growth-funnels";
+import { migration030SemAdmisionFunnel } from "@/core/migrations/030-sem-admision-funnel";
 import type { MigrationDefinition } from "@/core/migrations/types";
 
 /** Registro ordenado de migraciones — añadir nuevas al final */
 export const MIGRATIONS: MigrationDefinition[] = [
   migration001HeroV2,
   migration002MenuV2,
   migration003FooterV2,
   migration004BrandingV2,
   migration005ContentV2,
   migration006SaasFoundation,
@@ -51,15 +52,16 @@ export const MIGRATIONS: MigrationDefinition[] = [
   migration019GrowthWhatsApp,
   migration020GrowthWhatsAppOutbound,
   migration021GrowthCampaigns,
   migration022GrowthAnalytics,
   migration023GrowthTeamMembershipUnique,
   migration024GrowthStartupNextAction,
   migration025PlatformDefaultDomains,
   migration026PlatformWildcardSubdomains,
   migration027StripForeignSemAssets,
   migration028GrowthFunnels,
+  migration030SemAdmisionFunnel,
 ];
 
 export function getMigrationById(id: string): MigrationDefinition | undefined {
   return MIGRATIONS.find((m) => m.id === id);
 }
diff --git a/tests/baseline/sem-admision-funnel.test.ts b/tests/baseline/sem-admision-funnel.test.ts
index b591c9f..d2674d4 100644
--- a/tests/baseline/sem-admision-funnel.test.ts
+++ b/tests/baseline/sem-admision-funnel.test.ts
@@ -1,16 +1,17 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 import {
   SEM_ADMISION_FUNNEL_NAME,
   isSemAdmisionStages,
   mapLegacyStatusToSemAdmision,
+  planSemAdmisionStatusRemaps,
   semAdmisionIntermediateStages,
   semAdmisionStages,
 } from "../../src/core/growth/sem-admision-funnel";
 import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
 import { ensureGrowthFunnelsForTenant, applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
 import { platformDefaultStages } from "../../src/core/growth/funnel-stages";
 import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
 import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";
 
 describe("sem admision funnel", () => {
@@ -34,20 +35,33 @@ describe("sem admision funnel", () => {
 
   it("remapea open→interes, otras intermedias→contactado, y no toca resultados ni etapas SEM", () => {
     assert.equal(mapLegacyStatusToSemAdmision("open"), "interes");
     assert.equal(mapLegacyStatusToSemAdmision("in_follow_up"), "contactado");
     assert.equal(mapLegacyStatusToSemAdmision("en-seguimiento"), "contactado");
     assert.equal(mapLegacyStatusToSemAdmision("won"), null);
     assert.equal(mapLegacyStatusToSemAdmision("interes"), null);
     assert.equal(mapLegacyStatusToSemAdmision("orientacion"), null);
   });
 
+  it("planSemAdmisionStatusRemaps solo lista abiertas legacy", () => {
+    const plan = planSemAdmisionStatusRemaps([
+      { _id: "1", status: "open" },
+      { _id: "2", status: "won" },
+      { _id: "3", status: "interes" },
+      { _id: "4", status: "seguimiento" },
+    ]);
+    assert.deepEqual(plan, [
+      { id: "1", from: "open", to: "interes" },
+      { id: "4", from: "seguimiento", to: "contactado" },
+    ]);
+  });
+
   it("applySemAdmisionDefaultFunnel renombra default y deja etapas SEM; segunda pasada no cambia", async () => {
     const directory = createMemoryFunnelDirectory();
     await ensureGrowthFunnelsForTenant(directory, SEM_TENANT_ID, "2026-11-09T00:00:00.000Z");
     const first = await applySemAdmisionDefaultFunnel(
       directory,
       SEM_TENANT_ID,
       "2026-11-09T01:00:00.000Z"
     );
     assert.equal(first.changed, true);
     assert.equal(first.funnel.name, "Admisión");

```
