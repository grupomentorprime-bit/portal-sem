# Review package Task 5
Base: 5439e891a56a7a0e220f1ef35579eb970bbc6b57
Head: 69f020d3181b39f419e95f0cad0bd06d46e9a46d

## Commits
69f020d feat(ventas): default cola view switcher

## Stat
 src/app/admin/ventas/page.tsx                    |   3 +-
 src/components/admin/growth/VentasListClient.tsx | 223 +++++++++++++++++------
 src/lib/growth/ventas-vista.ts                   |  10 +
 tests/baseline/sem-admision-ventas-vista.test.ts |  34 ++++
 4 files changed, 209 insertions(+), 61 deletions(-)

## Diff
```diff
diff --git a/src/app/admin/ventas/page.tsx b/src/app/admin/ventas/page.tsx
index fea1dc1..56f3a97 100644
--- a/src/app/admin/ventas/page.tsx
+++ b/src/app/admin/ventas/page.tsx
@@ -1,14 +1,15 @@
 import { VentasListClient } from "@/components/admin/growth/VentasListClient";
 import { can } from "@/core/identity/policies/engine";
 import { readCommercialPanel } from "@/lib/growth/commercial-read";
 import { readGrowthVentasBoard } from "@/lib/growth/ventas-read";
+import { parseGrowthVentasVista } from "@/lib/growth/ventas-vista";
 import { listGrowthSpaceMembers } from "@/lib/growth/space-members";
 import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
 import { loadSessionContext } from "@/lib/identity/sessions";
 import { redirect } from "next/navigation";
 
 export const dynamic = "force-dynamic";
 
 interface PageProps {
   searchParams: Promise<{
     q?: string;
@@ -56,21 +57,21 @@ export default async function AdminVentasPage({ searchParams }: PageProps) {
   }
 
   const params = await searchParams;
   const q = params.q?.trim() ?? "";
   const status = params.status?.trim() ?? "";
   const type = params.type?.trim() ?? "";
   const nextAction = params.nextAction?.trim() ?? "";
   const funnel = params.funnel?.trim() ?? "";
   const band = params.banda?.trim() ?? "";
   const mine = params.mias === "1" || params.mias === "true";
-  const vista = params.vista === "lista" ? "lista" : "kanban";
+  const vista = parseGrowthVentasVista(params.vista);
   const userId = session.user._id;
   const canViewSpace = can(authCtx, "growth.sales.view");
   ensureCumpleGrowthAssessmentPort();
 
   const [board, panel] = await Promise.all([
     readGrowthVentasBoard(tenantId, {
       q: q || undefined,
       status: status || undefined,
       type: type || undefined,
       funnel: funnel || undefined,
diff --git a/src/components/admin/growth/VentasListClient.tsx b/src/components/admin/growth/VentasListClient.tsx
index fbe61cd..13bf612 100644
--- a/src/components/admin/growth/VentasListClient.tsx
+++ b/src/components/admin/growth/VentasListClient.tsx
@@ -5,20 +5,21 @@ import { Button } from "@/components/ui/button";
 import { useCallback, useEffect, useState, useTransition, type CSSProperties, type ReactNode } from "react";
 import { useRouter } from "next/navigation";
 import {
   CalendarClock,
   ChevronDown,
   ChevronRight,
   Clock,
   Handshake,
   LayoutGrid,
   List,
+  ListOrdered,
   MoreHorizontal,
   UserRound,
 } from "lucide-react";
 import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
 import { SearchBar } from "@/components/admin/kit/search/SearchBar";
 import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
 import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
 import { isGrowthFunnelResultKey } from "@/core/growth/funnel-types";
 import {
   GROWTH_BAND_FILTER_OPTIONS,
@@ -35,20 +36,21 @@ import {
   GROWTH_VENTAS_PAGE_TITLE,
   GROWTH_NEXT_ACTION_SECTION_LABEL,
 } from "@/lib/growth/labels";
 import type { GrowthPriorityBand } from "@/core/growth/priority";
 import type {
   GrowthVentasBoardLane,
   GrowthVentasFunnelOption,
   GrowthVentasQueueItemView,
   GrowthVentasStatusOption,
 } from "@/lib/growth/ventas-view";
+import type { GrowthVentasVista } from "@/lib/growth/ventas-vista";
 import { kanbanColumnWidth } from "@/lib/growth/kanban-column-width";
 import { cn } from "@/lib/utils";
 import { OwnerSelect } from "./OwnerSelect";
 
 export interface VentasAttentionCounts {
   overdue: number;
   unfollowed: number;
   stale: number;
   /** null = sin permiso de vista de Espacio (no se muestra). */
   unassigned: number | null;
@@ -59,21 +61,21 @@ export interface VentasListClientProps {
   funnels: GrowthVentasFunnelOption[];
   lanes: GrowthVentasBoardLane[];
   statusOptions: GrowthVentasStatusOption[];
   q: string;
   status: string;
   type: string;
   funnel: string;
   nextAction: string;
   band: string;
   mine: boolean;
-  vista: "lista" | "kanban";
+  vista: GrowthVentasVista;
   attention: VentasAttentionCounts;
   canOperate: boolean;
   members: Array<{ userId: string; label: string }>;
 }
 
 function statusTone(status: string): "active" | "inactive" | "info" {
   if (status === "won" || status === "handed_off") return "active";
   if (status === "lost" || status === "archived") return "inactive";
   return "info";
 }
@@ -210,39 +212,39 @@ export function VentasListClient({
 
   const pushFilters = useCallback(
     (next: {
       q?: string;
       status?: string;
       type?: string;
       funnel?: string;
       nextAction?: string;
       band?: string;
       mine?: boolean;
-      vista?: "lista" | "kanban";
+      vista?: GrowthVentasVista;
     }) => {
       const params = new URLSearchParams();
       const nextQ = next.q ?? q;
       const nextStatus = next.status ?? status;
       const nextType = next.type ?? type;
       const nextFunnel = next.funnel ?? funnel;
       const nextNext = next.nextAction ?? nextAction;
       const nextBand = next.band ?? band;
       const nextMine = next.mine ?? mine;
       const nextVista = next.vista ?? vista;
       if (nextQ.trim()) params.set("q", nextQ.trim());
       if (nextStatus) params.set("status", nextStatus);
       if (nextType) params.set("type", nextType);
       if (nextFunnel) params.set("funnel", nextFunnel);
       if (nextNext) params.set("nextAction", nextNext);
       if (nextBand) params.set("banda", nextBand);
       if (nextMine) params.set("mias", "1");
-      if (nextVista === "lista") params.set("vista", "lista");
+      if (nextVista !== "cola") params.set("vista", nextVista);
       const qs = params.toString();
       startTransition(() => {
         router.push(qs ? `/admin/ventas?${qs}` : "/admin/ventas");
       });
     },
     [band, funnel, mine, nextAction, q, router, status, type, vista]
   );
 
   const move = useCallback(
     (id: string, toState: string, label: string) => {
@@ -267,20 +269,21 @@ export function VentasListClient({
           setMoving(false);
         }
       })();
     },
     [confirm, router]
   );
 
   const hasFilters = Boolean(q || status || type || nextAction || funnel || band || mine);
   const isEmpty = items.length === 0;
   const isTrueEmpty = isEmpty && !hasFilters;
+  const isListView = vista === "cola" || vista === "lista";
   const attentionChips = [
     { key: "overdue", label: "Vencidas", count: attention.overdue },
     { key: "unfollowed", label: "Sin seguimiento", count: attention.unfollowed },
     { key: "stale", label: "Estancadas", count: attention.stale },
     ...(attention.unassigned != null
       ? [{ key: "unassigned", label: "Sin responsable", count: attention.unassigned }]
       : []),
   ] as const;
   const knownStatus = statusOptions.some((option) => option.value === status);
   const statusChoices = !status || knownStatus
@@ -327,21 +330,21 @@ export function VentasListClient({
         options={[...GROWTH_NEXT_ACTION_FILTER_OPTIONS]}
       />
       {hasFilters ? (
         <Button
           type="button"
           variant="outline"
           size="sm"
           className="h-10 shrink-0 rounded-xl"
           onClick={() =>
             startTransition(() => {
-              router.push(vista === "lista" ? "/admin/ventas?vista=lista" : "/admin/ventas");
+              router.push("/admin/ventas");
             })
           }
         >
           Limpiar
         </Button>
       ) : null}
     </div>
   );
 
   return (
@@ -418,20 +421,34 @@ export function VentasListClient({
           Mías
         </button>
       </div>
 
       <div className="mb-4 flex flex-wrap items-center gap-3">
         <div
           className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-[var(--admin-border-subtle)]"
           role="group"
           aria-label="Vista de oportunidades"
         >
+          <button
+            type="button"
+            aria-pressed={vista === "cola"}
+            className={cn(
+              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
+              vista === "cola"
+                ? "bg-[var(--growth-os-primary)] text-white"
+                : "text-muted hover:text-foreground"
+            )}
+            onClick={() => pushFilters({ vista: "cola" })}
+          >
+            <ListOrdered className="h-3.5 w-3.5" aria-hidden />
+            Cola
+          </button>
           <button
             type="button"
             aria-pressed={vista === "kanban"}
             className={cn(
               "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
               vista === "kanban"
                 ? "bg-[var(--growth-os-primary)] text-white"
                 : "text-muted hover:text-foreground"
             )}
             onClick={() => pushFilters({ vista: "kanban" })}
@@ -465,102 +482,188 @@ export function VentasListClient({
       <div className="mb-5">{filterBar}</div>
 
       {moveError ? (
         <p
           role="alert"
           className="mb-4 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
         >
           {moveError}
         </p>
       ) : null}
-      {vista === "lista" && isEmpty ? (
+      {isListView && isEmpty ? (
         <EmptyState
           title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
           description={
             hasFilters ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION : GROWTH_VENTAS_EMPTY_DESCRIPTION
           }
           icon={<Handshake className="h-8 w-8" />}
         />
       ) : null}
-      {vista === "lista" && !isEmpty ? (
-        <ul className={cn("flex flex-col gap-3", (pending || moving) && "opacity-70 transition-opacity")}>
-          {items.map((item) => (
-            <li key={item.id} className={cn(rowClass, "px-4 py-4")}>
-              <Link
-                href={`/admin/ventas/${encodeURIComponent(item.id)}`}
-                className="flex items-start gap-4 no-underline"
-              >
-                <div className="min-w-0 flex-1 space-y-2.5">
-                  <div className="flex flex-wrap items-center gap-2">
-                    <p className="text-[15px] font-semibold tracking-tight text-foreground">
-                      {item.personaDisplayName}
-                    </p>
-                    <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
-                  </div>
-
-                  <div>
-                    <p className={cn(aek.label, "mb-1")}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
-                    <p
-                      className={cn(
-                        "text-[17px] font-semibold tracking-tight",
-                        item.hasNextAction ? "text-foreground" : "text-muted"
-                      )}
-                    >
-                      {item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}
-                    </p>
-                  </div>
-
-                  <p className="text-sm text-muted">
-                    {item.originLabel}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {item.typeLabel}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {item.funnelName}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {item.stageLabel}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {item.priorityBand ? growthPriorityBandLabel(item.priorityBand) : item.statusLabel}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {item.ownerLabel ?? "Sin responsable"}
-                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
-                    {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}: {item.lastActivityLabel}
-                  </p>
-                </div>
-                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
-              </Link>
-              <OpportunityMoveControl
-                item={item}
-                canOperate={canOperate}
-                pending={pending || moving}
-                onMove={move}
-              />
-            </li>
-          ))}
-        </ul>
+      {isListView && !isEmpty ? (
+        <VentasQueueList
+          items={items}
+          vista={vista}
+          canOperate={canOperate}
+          pending={pending || moving}
+          onMove={move}
+        />
       ) : null}
       {vista === "kanban" ? (
         <KanbanBoard
           items={items}
           lanes={lanes}
           canOperate={canOperate}
           members={members}
           pending={pending || moving}
           isEmpty={isEmpty}
           hasFilters={hasFilters}
           onMove={move}
           onReject={(message) => setMoveError(message)}
         />
       ) : null}
     </AdminModulePage>
   );
 }
 
+function VentasQueueList({
+  items,
+  vista,
+  canOperate,
+  pending,
+  onMove,
+}: {
+  items: GrowthVentasQueueItemView[];
+  vista: Extract<GrowthVentasVista, "cola" | "lista">;
+  canOperate: boolean;
+  pending: boolean;
+  onMove: (id: string, toState: string, label: string) => void;
+}) {
+  return (
+    <ul className={cn("flex flex-col gap-3", pending && "opacity-70 transition-opacity")}>
+      {items.map((item) => (
+        <li key={item.id} className={cn(rowClass, "px-4 py-4")}>
+          <Link
+            href={`/admin/ventas/${encodeURIComponent(item.id)}`}
+            className="flex items-start gap-4 no-underline"
+          >
+            {vista === "cola" ? <ColaRowBody item={item} /> : <ListaRowBody item={item} />}
+            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
+          </Link>
+          <OpportunityMoveControl
+            item={item}
+            canOperate={canOperate}
+            pending={pending}
+            onMove={onMove}
+          />
+        </li>
+      ))}
+    </ul>
+  );
+}
+
+function ColaRowBody({ item }: { item: GrowthVentasQueueItemView }) {
+  return (
+    <div className="min-w-0 flex-1 space-y-2.5">
+      <div className="flex flex-wrap items-center gap-2">
+        <p className="text-[15px] font-semibold tracking-tight text-foreground">
+          {item.personaDisplayName}
+        </p>
+        <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
+        {item.priorityBand ? (
+          <span
+            className={cn(
+              "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
+              BAND_PILL[item.priorityBand]
+            )}
+          >
+            {growthPriorityBandLabel(item.priorityBand)}
+          </span>
+        ) : null}
+      </div>
+
+      <div className="grid gap-2 text-sm sm:grid-cols-3">
+        <div className="min-w-0">
+          <p className={cn(aek.label, "mb-1")}>Etapa</p>
+          <p className="truncate text-foreground">{item.stageLabel}</p>
+        </div>
+        <div className="min-w-0">
+          <p className={cn(aek.label, "mb-1")}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
+          <p
+            className={cn(
+              "truncate font-medium",
+              item.hasNextAction ? "text-foreground" : "text-muted"
+            )}
+            title={item.hasNextAction ? item.nextActionLabel : undefined}
+          >
+            {item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}
+          </p>
+        </div>
+        <div className="min-w-0">
+          <p className={cn(aek.label, "mb-1")}>Responsable</p>
+          <p className={cn("truncate", item.ownerLabel ? "text-foreground" : "text-muted")}>
+            {item.ownerLabel ?? "Sin responsable"}
+          </p>
+        </div>
+      </div>
+
+      <p className="text-sm text-muted">
+        {item.funnelName}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.typeLabel}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}: {item.lastActivityLabel}
+      </p>
+    </div>
+  );
+}
+
+function ListaRowBody({ item }: { item: GrowthVentasQueueItemView }) {
+  return (
+    <div className="min-w-0 flex-1 space-y-2.5">
+      <div className="flex flex-wrap items-center gap-2">
+        <p className="text-[15px] font-semibold tracking-tight text-foreground">
+          {item.personaDisplayName}
+        </p>
+        <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
+      </div>
+
+      <div>
+        <p className={cn(aek.label, "mb-1")}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
+        <p
+          className={cn(
+            "text-[17px] font-semibold tracking-tight",
+            item.hasNextAction ? "text-foreground" : "text-muted"
+          )}
+        >
+          {item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}
+        </p>
+      </div>
+
+      <p className="text-sm text-muted">
+        {item.originLabel}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.typeLabel}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.funnelName}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.stageLabel}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.priorityBand ? growthPriorityBandLabel(item.priorityBand) : item.statusLabel}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {item.ownerLabel ?? "Sin responsable"}
+        <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
+        {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}: {item.lastActivityLabel}
+      </p>
+    </div>
+  );
+}
+
 function KanbanBoard({
   items,
   lanes,
   canOperate,
   members,
   pending,
   isEmpty,
   hasFilters,
   onMove,
   onReject,
diff --git a/src/lib/growth/ventas-vista.ts b/src/lib/growth/ventas-vista.ts
new file mode 100644
index 0000000..82fdaaf
--- /dev/null
+++ b/src/lib/growth/ventas-vista.ts
@@ -0,0 +1,10 @@
+export type GrowthVentasVista = "cola" | "kanban" | "lista";
+
+export function parseGrowthVentasVista(
+  raw: string | undefined | null
+): GrowthVentasVista {
+  const value = raw?.trim().toLowerCase();
+  if (value === "kanban") return "kanban";
+  if (value === "lista") return "lista";
+  return "cola";
+}
diff --git a/tests/baseline/sem-admision-ventas-vista.test.ts b/tests/baseline/sem-admision-ventas-vista.test.ts
index 76db75b..bca06ac 100644
--- a/tests/baseline/sem-admision-ventas-vista.test.ts
+++ b/tests/baseline/sem-admision-ventas-vista.test.ts
@@ -1,15 +1,49 @@
 import assert from "node:assert/strict";
+import { existsSync, readFileSync } from "node:fs";
+import { resolve } from "node:path";
+import { pathToFileURL } from "node:url";
 import { describe, it } from "node:test";
 import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";
 
 describe("cola ventas por prioridad comercial", () => {
   it("ordena overdue antes que unfollowed y current", () => {
     const sorted = sortVentasQueueByPriority([
       { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
       { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
       { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
     ] as any);
 
     assert.deepEqual(sorted.map((item) => item.id), ["a", "b", "c"]);
   });
+
+  it("parsea la vista de ventas con cola como default", async () => {
+    const modulePath = resolve(process.cwd(), "src/lib/growth/ventas-vista.ts");
+    assert.equal(existsSync(modulePath), true);
+
+    const { parseGrowthVentasVista } = (await import(pathToFileURL(modulePath).href)) as {
+      parseGrowthVentasVista: (raw: string | undefined | null) => "cola" | "kanban" | "lista";
+    };
+
+    assert.equal(parseGrowthVentasVista(undefined), "cola");
+    assert.equal(parseGrowthVentasVista(""), "cola");
+    assert.equal(parseGrowthVentasVista("kanban"), "kanban");
+    assert.equal(parseGrowthVentasVista("lista"), "lista");
+    assert.equal(parseGrowthVentasVista("COLA"), "cola");
+  });
+
+  it("expone cola como vista predeterminada y en el switcher", () => {
+    const pageSource = readFileSync(
+      resolve(process.cwd(), "src/app/admin/ventas/page.tsx"),
+      "utf8"
+    );
+    const listSource = readFileSync(
+      resolve(process.cwd(), "src/components/admin/growth/VentasListClient.tsx"),
+      "utf8"
+    );
+
+    assert.match(pageSource, /parseGrowthVentasVista\(params\.vista\)/);
+    assert.match(listSource, /aria-pressed=\{vista === "cola"\}/);
+    assert.match(listSource, /pushFilters\(\{ vista: "cola" \}\)/);
+    assert.match(listSource, /Cola/);
+  });
 });

```
