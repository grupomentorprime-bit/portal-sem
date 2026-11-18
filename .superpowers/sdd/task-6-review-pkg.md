# Review package Task 6
Base: 69f020d3181b39f419e95f0cad0bd06d46e9a46d
Head: c2f175fa3e65773a63e164b16acc18127706df6d

## Commits
c2f175f fix(ventas): pass copy prop into KanbanBoard
16381b0 feat(ventas): copy Admisión para Espacio SEM

## Stat
 .superpowers/sdd/task-6-report.md                | 11 +++++++
 src/app/admin/ventas/page.tsx                    |  3 ++
 src/components/admin/growth/VentasListClient.tsx | 38 +++++++++++-------------
 src/lib/growth/labels.ts                         | 30 +++++++++++++++++++
 tests/baseline/sem-admision-ventas-vista.test.ts |  7 +++++
 5 files changed, 69 insertions(+), 20 deletions(-)

## Diff
```diff
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
index 56f3a97..d6bd552 100644
--- a/src/app/admin/ventas/page.tsx
+++ b/src/app/admin/ventas/page.tsx
@@ -1,13 +1,14 @@
 import { VentasListClient } from "@/components/admin/growth/VentasListClient";
 import { can } from "@/core/identity/policies/engine";
 import { readCommercialPanel } from "@/lib/growth/commercial-read";
+import { growthVentasPageCopy } from "@/lib/growth/labels";
 import { readGrowthVentasBoard } from "@/lib/growth/ventas-read";
 import { parseGrowthVentasVista } from "@/lib/growth/ventas-vista";
 import { listGrowthSpaceMembers } from "@/lib/growth/space-members";
 import { ensureCumpleGrowthAssessmentPort } from "@/sites/cumple/growth-assessment";
 import { loadSessionContext } from "@/lib/identity/sessions";
 import { redirect } from "next/navigation";
 
 export const dynamic = "force-dynamic";
 
 interface PageProps {
@@ -76,23 +77,25 @@ export default async function AdminVentasPage({ searchParams }: PageProps) {
       type: type || undefined,
       funnel: funnel || undefined,
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
       nextAction={nextAction}
       band={band}
diff --git a/src/components/admin/growth/VentasListClient.tsx b/src/components/admin/growth/VentasListClient.tsx
index 13bf612..a7e0910 100644
--- a/src/components/admin/growth/VentasListClient.tsx
+++ b/src/components/admin/growth/VentasListClient.tsx
@@ -20,28 +20,23 @@ import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
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
 import type { GrowthVentasVista } from "@/lib/growth/ventas-vista";
 import { kanbanColumnWidth } from "@/lib/growth/kanban-column-width";
@@ -50,20 +45,21 @@ import { OwnerSelect } from "./OwnerSelect";
 
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
@@ -181,20 +177,21 @@ async function requestOpportunityTransition(
   if (response.ok) return { ok: true };
   try {
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
   nextAction,
   band,
@@ -344,32 +341,32 @@ export function VentasListClient({
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
           >
             {activeFunnels.length !== 1 ? <option value="">Todos los embudos</option> : null}
@@ -484,38 +481,37 @@ export function VentasListClient({
       {moveError ? (
         <p
           role="alert"
           className="mb-4 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
         >
           {moveError}
         </p>
       ) : null}
       {isListView && isEmpty ? (
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
       {isListView && !isEmpty ? (
         <VentasQueueList
           items={items}
           vista={vista}
           canOperate={canOperate}
           pending={pending || moving}
           onMove={move}
         />
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
@@ -651,67 +647,67 @@ function ListaRowBody({ item }: { item: GrowthVentasQueueItemView }) {
         <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
         {item.ownerLabel ?? "Sin responsable"}
         <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
         {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}: {item.lastActivityLabel}
       </p>
     </div>
   );
 }
 
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
         const closedItems = laneItems.filter((item) => isGrowthFunnelResultKey(item.status));
         return (
@@ -1089,10 +1085,12 @@ function OpportunityMoveControl({
             {transition.label}
           </option>
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
diff --git a/src/lib/growth/labels.ts b/src/lib/growth/labels.ts
index 9cc5074..ad32f6e 100644
--- a/src/lib/growth/labels.ts
+++ b/src/lib/growth/labels.ts
@@ -5,20 +5,21 @@
 
 import { GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE } from "@/core/growth/opportunity-definition";
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
 
 const ACTIVITY_KIND_LABELS: Record<GrowthActivityKind, string> = {
@@ -216,20 +217,49 @@ export const GROWTH_VENTAS_CURRENT_STATUS_LABEL = "Estado actual";
 export const GROWTH_VENTAS_OPEN_PERSONA_LABEL = "Abrir Persona";
 export const GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL = "Quitar acción";
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
 export const GROWTH_MENSAJES_NO_MATCH_DESCRIPTION =
   "Prueba con otro nombre o quita la búsqueda.";
diff --git a/tests/baseline/sem-admision-ventas-vista.test.ts b/tests/baseline/sem-admision-ventas-vista.test.ts
index bca06ac..47d1ebf 100644
--- a/tests/baseline/sem-admision-ventas-vista.test.ts
+++ b/tests/baseline/sem-admision-ventas-vista.test.ts
@@ -1,16 +1,18 @@
 import assert from "node:assert/strict";
 import { existsSync, readFileSync } from "node:fs";
 import { resolve } from "node:path";
 import { pathToFileURL } from "node:url";
 import { describe, it } from "node:test";
 import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";
+import { growthVentasPageCopy } from "../../src/lib/growth/labels";
+import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
 
 describe("cola ventas por prioridad comercial", () => {
   it("ordena overdue antes que unfollowed y current", () => {
     const sorted = sortVentasQueueByPriority([
       { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
       { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
       { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
     ] as any);
 
     assert.deepEqual(sorted.map((item) => item.id), ["a", "b", "c"]);
@@ -39,11 +41,16 @@ describe("cola ventas por prioridad comercial", () => {
     const listSource = readFileSync(
       resolve(process.cwd(), "src/components/admin/growth/VentasListClient.tsx"),
       "utf8"
     );
 
     assert.match(pageSource, /parseGrowthVentasVista\(params\.vista\)/);
     assert.match(listSource, /aria-pressed=\{vista === "cola"\}/);
     assert.match(listSource, /pushFilters\(\{ vista: "cola" \}\)/);
     assert.match(listSource, /Cola/);
   });
+
+  it("usa copy SEM en la página de ventas", () => {
+    assert.equal(growthVentasPageCopy(SEM_TENANT_ID).title, "Admisión");
+    assert.equal(growthVentasPageCopy(ADL_TENANT_ID).title, "Ventas");
+  });
 });

```
