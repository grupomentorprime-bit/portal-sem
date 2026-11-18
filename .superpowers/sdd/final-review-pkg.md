# Final branch review package
Base: 12ac89c8c80c1e10db94bbb5c7d50f3253cd1168
Head: 69a861328c875c259eb466ce14e5e37bd252ab45

## Commits
69a8613 chore(growth): export planSemAdmisionStatusRemaps from barrel
c2f175f fix(ventas): pass copy prop into KanbanBoard
16381b0 feat(ventas): copy Admisión para Espacio SEM
69f020d feat(ventas): default cola view switcher
5439e89 feat(ventas): ordenar cola por prioridad comercial
7ac62a4 feat(growth): migración 030 embudo Admisión SEM
ed0d606 feat(growth): apply embudo Admisión SEM sobre funnel default
b023db1 fix(growth): validate result stages in isSemAdmisionStages
5de113c feat(growth): modelo puro embudo Admisión SEM

## Stat
 .superpowers/sdd/task-1-report.md                |  53 +++++
 .superpowers/sdd/task-6-report.md                |  11 +
 src/app/admin/ventas/page.tsx                    |   6 +-
 src/components/admin/growth/VentasListClient.tsx | 261 ++++++++++++++++-------
 src/core/growth/funnels.ts                       |  62 ++++++
 src/core/growth/index.ts                         |  10 +
 src/core/growth/sem-admision-funnel.ts           | 102 +++++++++
 src/core/migrations/030-sem-admision-funnel.ts   |  55 +++++
 src/core/migrations/registry.ts                  |   2 +
 src/lib/growth/labels.ts                         |  30 +++
 src/lib/growth/ventas-board.ts                   |  16 ++
 src/lib/growth/ventas-read.ts                    |   7 +-
 src/lib/growth/ventas-vista.ts                   |  10 +
 tests/baseline/sem-admision-funnel.test.ts       |  79 +++++++
 tests/baseline/sem-admision-ventas-vista.test.ts |  56 +++++
 15 files changed, 677 insertions(+), 83 deletions(-)

## Diff
```diff
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
index 36556f1..a87e33b 100644
--- a/.superpowers/sdd/task-1-report.md
+++ b/.superpowers/sdd/task-1-report.md
@@ -1,8 +1,50 @@
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
@@ -31,8 +73,19 @@ Status: DONE_WITH_CONCERNS (decisiones de interpretación abajo)
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
diff --git a/.superpowers/sdd/task-6-report.md b/.superpowers/sdd/task-6-report.md
new file mode 100644
index 0000000..ab0e23a
--- /dev/null
+++ b/.superpowers/sdd/task-6-report.md
@@ -0,0 +1,11 @@
+Status: done
+Commit: 16381b0 feat(ventas): copy Admisión para Espacio SEM
+Test summary: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts` passed.
+Concerns: `src/core/growth/index.ts` still has pre-existing unrelated changes and was left untouched.
+Report path: `.superpowers/sdd/task-6-report.md`
+
+Status: fixed
+Commit: pending
+Test summary: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts` passed.
+Fix: added `copy` to `KanbanBoard` props and passed `copy={copy}` from `VentasListClient`.
+Report path: `.superpowers/sdd/task-6-report.md`
diff --git a/src/app/admin/ventas/page.tsx b/src/app/admin/ventas/page.tsx
index fea1dc1..d6bd552 100644
--- a/src/app/admin/ventas/page.tsx
+++ b/src/app/admin/ventas/page.tsx
@@ -1,12 +1,14 @@
 import { VentasListClient } from "@/components/admin/growth/VentasListClient";
 import { can } from "@/core/identity/policies/engine";
 import { readCommercialPanel } from "@/lib/growth/commercial-read";
+import { growthVentasPageCopy } from "@/lib/growth/labels";
 import { readGrowthVentasBoard } from "@/lib/growth/ventas-read";
+import { parseGrowthVentasVista } from "@/lib/growth/ventas-vista";
 import { listGrowthSpaceMembers } from "@/lib/growth/space-members";
 import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
 import { loadSessionContext } from "@/lib/identity/sessions";
 import { redirect } from "next/navigation";
 
 export const dynamic = "force-dynamic";
 
 interface PageProps {
@@ -58,17 +60,17 @@ export default async function AdminVentasPage({ searchParams }: PageProps) {
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
@@ -77,19 +79,21 @@ export default async function AdminVentasPage({ searchParams }: PageProps) {
       nextAction: nextAction || undefined,
       band: band || undefined,
       mine,
       userId,
     }),
     readCommercialPanel(tenantId, userId, canViewSpace),
   ]);
   const members = await listGrowthSpaceMembers(tenantId);
+  const copy = growthVentasPageCopy(tenantId);
 
   return (
     <VentasListClient
+      copy={copy}
       items={board.items}
       funnels={board.funnels}
       lanes={board.lanes}
       statusOptions={board.statusOptions}
       q={q}
       status={status}
       type={type}
       funnel={funnel}
diff --git a/src/components/admin/growth/VentasListClient.tsx b/src/components/admin/growth/VentasListClient.tsx
index fbe61cd..a7e0910 100644
--- a/src/components/admin/growth/VentasListClient.tsx
+++ b/src/components/admin/growth/VentasListClient.tsx
@@ -7,71 +7,69 @@ import { useRouter } from "next/navigation";
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
   GROWTH_NEXT_ACTION_FILTER_OPTIONS,
   growthPriorityBandLabel,
   GROWTH_NO_NEXT_ACTION_LABEL,
   GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
-  GROWTH_VENTAS_EMPTY_DESCRIPTION,
-  GROWTH_VENTAS_EMPTY_TITLE,
   GROWTH_VENTAS_LAST_ACTIVITY_LABEL,
-  GROWTH_VENTAS_NO_MATCH_DESCRIPTION,
-  GROWTH_VENTAS_NO_MATCH_TITLE,
-  GROWTH_VENTAS_PAGE_DESCRIPTION,
-  GROWTH_VENTAS_PAGE_TITLE,
   GROWTH_NEXT_ACTION_SECTION_LABEL,
+  growthVentasPageCopy,
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
 }
 
 export interface VentasListClientProps {
+  copy: ReturnType<typeof growthVentasPageCopy>;
   items: GrowthVentasQueueItemView[];
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
@@ -181,16 +179,17 @@ async function requestOpportunityTransition(
     const data = (await response.json()) as { error?: string };
     return { ok: false, error: data.error ?? "No se pudo mover la oportunidad." };
   } catch {
     return { ok: false, error: "No se pudo mover la oportunidad." };
   }
 }
 
 export function VentasListClient({
+  copy,
   items,
   funnels,
   lanes,
   statusOptions,
   q,
   status,
   type,
   funnel,
@@ -212,17 +211,17 @@ export function VentasListClient({
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
@@ -230,17 +229,17 @@ export function VentasListClient({
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
 
@@ -269,16 +268,17 @@ export function VentasListClient({
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
@@ -329,42 +329,42 @@ export function VentasListClient({
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
     <AdminModulePage
       breadcrumbs={[
         { label: "Inicio", href: "/admin" },
-        { label: GROWTH_VENTAS_PAGE_TITLE },
+        { label: copy.title },
       ]}
-      title={GROWTH_VENTAS_PAGE_TITLE}
+      title={copy.title}
       hideTitle
     >
       {dialog}
       <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
         <div className="min-w-0">
           <h1 className="text-[1.7rem] font-bold tracking-tight text-foreground">
-            {GROWTH_VENTAS_PAGE_TITLE}
+            {copy.title}
           </h1>
-          <p className="mt-1 text-sm text-muted">{GROWTH_VENTAS_PAGE_DESCRIPTION}</p>
+          <p className="mt-1 text-sm text-muted">{copy.description}</p>
         </div>
         <label className="relative inline-flex h-10 max-w-full items-center gap-1.5 rounded-xl border border-[var(--admin-border-subtle)] bg-white pl-3 pr-9 text-sm shadow-sm">
           <span className="shrink-0 text-muted">Embudo:</span>
           <select
             aria-label="Embudo activo"
             className="max-w-[16rem] appearance-none truncate bg-transparent font-semibold text-foreground outline-none"
             value={funnel || singleFunnelKey}
             onChange={(event) => pushFilters({ funnel: event.target.value === singleFunnelKey ? "" : event.target.value })}
@@ -420,16 +420,30 @@ export function VentasListClient({
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
@@ -467,146 +481,231 @@ export function VentasListClient({
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
-          title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
-          description={
-            hasFilters ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION : GROWTH_VENTAS_EMPTY_DESCRIPTION
-          }
+          title={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
+          description={hasFilters ? copy.noMatchDescription : copy.emptyDescription}
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
+          copy={copy}
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
+  copy,
   items,
   lanes,
   canOperate,
   members,
   pending,
   isEmpty,
   hasFilters,
   onMove,
   onReject,
 }: {
+  copy: ReturnType<typeof growthVentasPageCopy>;
   items: GrowthVentasQueueItemView[];
   lanes: GrowthVentasBoardLane[];
   canOperate: boolean;
   members: Array<{ userId: string; label: string }>;
   pending: boolean;
   isEmpty: boolean;
   hasFilters: boolean;
   onMove: (id: string, toState: string, label: string) => void;
   onReject: (message: string) => void;
 }) {
   const [overKey, setOverKey] = useState<string | null>(null);
   if (lanes.length === 0) {
     return (
       <EmptyState
-        title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
-        description={
-          hasFilters ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION : GROWTH_VENTAS_EMPTY_DESCRIPTION
-        }
+        title={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
+        description={hasFilters ? copy.noMatchDescription : copy.emptyDescription}
         icon={<Handshake className="h-8 w-8" />}
       />
     );
   }
 
   return (
     <div className={cn("min-w-0 space-y-6", pending && "opacity-70 transition-opacity")}>
       <style>{`
         .kanban-lane { --kanban-col: min(86vw, 22rem); }
         @media (min-width: 768px) {
           .kanban-lane { --kanban-col: 18.75rem; }
         }
       `}</style>
       {isEmpty ? (
         <EmptyState
-          title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
+          title={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
           description={
             hasFilters
-              ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION
+              ? copy.noMatchDescription
               : "El tablero muestra las etapas del embudo. Las oportunidades aparecerán en su columna."
           }
           icon={<Handshake className="h-8 w-8" />}
         />
       ) : null}
       {lanes.map((lane) => {
         const laneItems = items.filter((item) => item.funnelKey === lane.funnelKey);
         const openItems = laneItems.filter((item) => !isGrowthFunnelResultKey(item.status));
@@ -988,8 +1087,10 @@ function OpportunityMoveControl({
         ))}
       </select>
       <Button type="submit" size="sm" variant="outline" disabled={pending || !toState}>
         Mover
       </Button>
     </form>
   );
 }
+
+
diff --git a/src/core/growth/funnels.ts b/src/core/growth/funnels.ts
index 6b22d17..fa8efa1 100644
--- a/src/core/growth/funnels.ts
+++ b/src/core/growth/funnels.ts
@@ -11,16 +11,21 @@ import {
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
@@ -69,16 +74,31 @@ export async function listGrowthFunnelStages(
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
@@ -217,16 +237,58 @@ export async function renameGrowthFunnel(
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
diff --git a/src/core/growth/index.ts b/src/core/growth/index.ts
index a9f4004..93ff07d 100644
--- a/src/core/growth/index.ts
+++ b/src/core/growth/index.ts
@@ -69,16 +69,26 @@ export {
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
+  planSemAdmisionStatusRemaps,
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
diff --git a/src/core/growth/sem-admision-funnel.ts b/src/core/growth/sem-admision-funnel.ts
new file mode 100644
index 0000000..b8fe1e0
--- /dev/null
+++ b/src/core/growth/sem-admision-funnel.ts
@@ -0,0 +1,102 @@
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
@@ -21,16 +21,17 @@ import { migration020GrowthWhatsAppOutbound } from "@/core/migrations/020-growth
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
@@ -53,13 +54,14 @@ export const MIGRATIONS: MigrationDefinition[] = [
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
diff --git a/src/lib/growth/labels.ts b/src/lib/growth/labels.ts
index 9cc5074..ad32f6e 100644
--- a/src/lib/growth/labels.ts
+++ b/src/lib/growth/labels.ts
@@ -7,16 +7,17 @@ import { GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE } from "@/core/growth/opportunity-
 import {
   GROWTH_DEFAULT_OPPORTUNITY_TYPES,
   type GrowthActivityKind,
   type GrowthNextActionKind,
   type GrowthOpportunityStatus,
   type GrowthOrigin,
   type GrowthOriginKind,
 } from "@/core/growth/types";
+import { isSemTenant } from "@/core/tenant/is-sem";
 
 const ORIGIN_KIND_LABELS: Record<GrowthOriginKind, string> = {
   admission: "Admisión",
   form: "Formulario",
   event: "Evento",
   manual: "Registro manual",
   unknown: "Sin origen claro",
 };
@@ -218,16 +219,45 @@ export const GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL = "Quitar acción";
 export const GROWTH_VENTAS_SET_NEXT_ACTION_LABEL = "Qué hacer ahora";
 export const GROWTH_VENTAS_SAVE_NOTE_LABEL = "Guardar nota";
 export const GROWTH_VENTAS_REGISTER_CONTACT_LABEL = "Registrar contacto";
 export const GROWTH_VENTAS_NOTE_KIND_LABEL = "Nota";
 export const GROWTH_VENTAS_CONTACT_KIND_LABEL = "Contacto";
 export const GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER =
   "Conversé con María. Quiere matricularse la próxima semana.";
 
+export function growthVentasPageCopy(tenantId: string): {
+  title: string;
+  description: string;
+  emptyTitle: string;
+  emptyDescription: string;
+  noMatchTitle: string;
+  noMatchDescription: string;
+} {
+  if (isSemTenant(tenantId)) {
+    return {
+      title: "Admisión",
+      description: "Postulantes y próximas acciones del Espacio.",
+      emptyTitle: "Aún no hay postulantes en seguimiento",
+      emptyDescription:
+        "Cuando lleguen consultas o postulaciones, aparecerán aquí para darles seguimiento.",
+      noMatchTitle: "No encontramos postulantes",
+      noMatchDescription: "Prueba con otro nombre o quita los filtros.",
+    };
+  }
+  return {
+    title: GROWTH_VENTAS_PAGE_TITLE,
+    description: GROWTH_VENTAS_PAGE_DESCRIPTION,
+    emptyTitle: GROWTH_VENTAS_EMPTY_TITLE,
+    emptyDescription: GROWTH_VENTAS_EMPTY_DESCRIPTION,
+    noMatchTitle: GROWTH_VENTAS_NO_MATCH_TITLE,
+    noMatchDescription: GROWTH_VENTAS_NO_MATCH_DESCRIPTION,
+  };
+}
+
 /** OT-GROWTH-MESSAGING-004 — bandeja de mensajes. */
 export const GROWTH_MENSAJES_PAGE_TITLE = "Mensajes";
 export const GROWTH_MENSAJES_PAGE_DESCRIPTION =
   "Conversaciones del Espacio activo.";
 export const GROWTH_MENSAJES_EMPTY_TITLE = "Aún no hay conversaciones";
 export const GROWTH_MENSAJES_EMPTY_DESCRIPTION =
   "Cuando lleguen mensajes, aparecerán aquí para leerlos y responder.";
 export const GROWTH_MENSAJES_NO_MATCH_TITLE = "No encontramos conversaciones";
diff --git a/src/lib/growth/ventas-board.ts b/src/lib/growth/ventas-board.ts
index fae6c66..9bc34e2 100644
--- a/src/lib/growth/ventas-board.ts
+++ b/src/lib/growth/ventas-board.ts
@@ -93,16 +93,32 @@ export function growthVentasStatusOptions(
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
diff --git a/src/lib/growth/ventas-read.ts b/src/lib/growth/ventas-read.ts
index 6c9ab9d..2a7f620 100644
--- a/src/lib/growth/ventas-read.ts
+++ b/src/lib/growth/ventas-read.ts
@@ -50,16 +50,17 @@ import {
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
@@ -259,30 +260,32 @@ export async function readGrowthVentasBoard(
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
diff --git a/tests/baseline/sem-admision-funnel.test.ts b/tests/baseline/sem-admision-funnel.test.ts
new file mode 100644
index 0000000..d2674d4
--- /dev/null
+++ b/tests/baseline/sem-admision-funnel.test.ts
@@ -0,0 +1,79 @@
+import assert from "node:assert/strict";
+import { describe, it } from "node:test";
+import {
+  SEM_ADMISION_FUNNEL_NAME,
+  isSemAdmisionStages,
+  mapLegacyStatusToSemAdmision,
+  planSemAdmisionStatusRemaps,
+  semAdmisionIntermediateStages,
+  semAdmisionStages,
+} from "../../src/core/growth/sem-admision-funnel";
+import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
+import { ensureGrowthFunnelsForTenant, applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
+import { platformDefaultStages } from "../../src/core/growth/funnel-stages";
+import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
+import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";
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
+
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
+});
diff --git a/tests/baseline/sem-admision-ventas-vista.test.ts b/tests/baseline/sem-admision-ventas-vista.test.ts
new file mode 100644
index 0000000..47d1ebf
--- /dev/null
+++ b/tests/baseline/sem-admision-ventas-vista.test.ts
@@ -0,0 +1,56 @@
+import assert from "node:assert/strict";
+import { existsSync, readFileSync } from "node:fs";
+import { resolve } from "node:path";
+import { pathToFileURL } from "node:url";
+import { describe, it } from "node:test";
+import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";
+import { growthVentasPageCopy } from "../../src/lib/growth/labels";
+import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
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
+
+  it("usa copy SEM en la página de ventas", () => {
+    assert.equal(growthVentasPageCopy(SEM_TENANT_ID).title, "Admisión");
+    assert.equal(growthVentasPageCopy(ADL_TENANT_ID).title, "Ventas");
+  });
+});

```
