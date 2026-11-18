# Review package Task 4
Base: 7ac62a495881451547a2fcc64a2627de0f701548
Head: 5439e891a56a7a0e220f1ef35579eb970bbc6b57

## Commits
5439e89 feat(ventas): ordenar cola por prioridad comercial

## Stat
 src/lib/growth/ventas-board.ts                   | 16 ++++++++++++++++
 src/lib/growth/ventas-read.ts                    |  7 +++++--
 tests/baseline/sem-admision-ventas-vista.test.ts | 15 +++++++++++++++
 3 files changed, 36 insertions(+), 2 deletions(-)

## Diff
```diff
diff --git a/src/lib/growth/ventas-board.ts b/src/lib/growth/ventas-board.ts
index fae6c66..9bc34e2 100644
--- a/src/lib/growth/ventas-board.ts
+++ b/src/lib/growth/ventas-board.ts
@@ -91,20 +91,36 @@ export function growthVentasStatusOptions(
       options.push({ value: stage.key, label: stage.label });
     }
   }
   for (const result of GROWTH_FUNNEL_RESULTS) {
     if (seen.has(result.key)) continue;
     options.push({ value: result.key, label: result.label });
   }
   return options;
 }
 
+export function sortVentasQueueByPriority<
+  T extends {
+    priorityRank: number;
+    priorityKey: number | null;
+    updatedAt: string;
+  }
+>(items: T[]): T[] {
+  return items.slice().sort((a, b) => {
+    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
+    if (a.priorityKey != null && b.priorityKey != null && a.priorityKey !== b.priorityKey) {
+      return a.priorityKey - b.priorityKey;
+    }
+    return b.updatedAt.localeCompare(a.updatedAt);
+  });
+}
+
 function columnsForFunnel(
   stages: GrowthFunnelStage[],
   items: GrowthVentasQueueItemView[]
 ): GrowthVentasStageColumn[] {
   const columns: GrowthVentasStageColumn[] = intermediateStages(stages)
     .filter(
       (stage) => stage.active || items.some((item) => item.status === stage.key)
     )
     .map((stage) => ({
       key: stage.key,
diff --git a/src/lib/growth/ventas-read.ts b/src/lib/growth/ventas-read.ts
index 6c9ab9d..2a7f620 100644
--- a/src/lib/growth/ventas-read.ts
+++ b/src/lib/growth/ventas-read.ts
@@ -48,20 +48,21 @@ import { listPersonaConversationViews } from "./personas-read";
 import {
   activitiesVisibleInUi,
   escapeGrowthSearchRegex,
   sortActivitiesNewestFirst,
   toActivityView,
   toOportunidadDetailView,
 } from "./persona-view";
 import {
   growthVentasBoardLanes,
   growthVentasStatusOptions,
+  sortVentasQueueByPriority,
 } from "./ventas-board";
 import type {
   GrowthVentasBoardLane,
   GrowthVentasFunnelOption,
   GrowthVentasOpportunityOperateView,
   GrowthVentasQueueItemView,
   GrowthVentasStatusOption,
 } from "./ventas-view";
 
 export type {
@@ -257,34 +258,36 @@ export async function readGrowthVentasBoard(
 
   const personaById = new Map(personas.map((p) => [p._id, p]));
   const lastActivityByOpp = new Map<string, GrowthActivity>();
   for (const a of activitiesVisibleInUi(activities)) {
     if (!a.oportunidadId) continue;
     if (!lastActivityByOpp.has(a.oportunidadId)) {
       lastActivityByOpp.set(a.oportunidadId, a);
     }
   }
 
-  const items = oportunidades
+  const items = sortVentasQueueByPriority(
+    oportunidades
     .filter((oportunidad) => oportunidad.tenantId === tenantId)
     .map((oportunidad) =>
       presentQueueItem(
         oportunidad,
         personaById.get(oportunidad.personaId),
         lastActivityByOpp.get(oportunidad._id),
         funnels,
         stagesByFunnel,
         now,
         config.staleAfterDays ?? 7,
         oportunidad.ownerUserId ? ownerLabels.get(oportunidad.ownerUserId) : undefined
       )
-    );
+    )
+  );
 
   const band = filters.band?.trim();
   const visible = items.filter((item) => {
     if (!band) return true;
     if (band === "unassigned") return !item.ownerUserId && item.priorityBand != null;
     return item.priorityBand === band;
   });
 
   return presentBoard(tenantId, funnels, stagesByFunnel, funnelFilter, visible);
 }
diff --git a/tests/baseline/sem-admision-ventas-vista.test.ts b/tests/baseline/sem-admision-ventas-vista.test.ts
new file mode 100644
index 0000000..76db75b
--- /dev/null
+++ b/tests/baseline/sem-admision-ventas-vista.test.ts
@@ -0,0 +1,15 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";
+
+describe("cola ventas por prioridad comercial", () => {
+  it("ordena overdue antes que unfollowed y current", () => {
+    const sorted = sortVentasQueueByPriority([
+      { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
+      { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
+      { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
+    ] as any);
+
+    assert.deepEqual(sorted.map((item) => item.id), ["a", "b", "c"]);
+  });
+});

```
