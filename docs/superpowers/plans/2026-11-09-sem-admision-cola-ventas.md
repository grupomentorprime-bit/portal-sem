# SEM Admisión · cola primero en Ventas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embudo de admisión SEM (6 etapas) + `/admin/ventas` con vista **Cola** por defecto, copy de admisión y oportunidades legacy remapeadas.

**Architecture:** Lógica pura de etapas/remap en `src/core/growth/sem-admision-funnel.ts`; aplicación vía API de embudos + migración `030-sem-admision-funnel` solo para `seminario-ipn`. La UI reusa lecturas de Ventas; ordena por prioridad comercial; añade vista `cola` sin segundo CRM.

**Tech Stack:** TypeScript, Next.js App Router, Mongo (`cms_migrations`), `node:test` vía `tsx --test`, `isSemTenant`.

**Spec:** `docs/superpowers/specs/2026-11-09-sem-admision-cola-ventas-design.md`

## Global Constraints

- Solo Espacio SEM: `SEM_TENANT_ID` = `seminario-ipn` (`isSemTenant`).
- Conservar `funnelKey` `default`; renombrar nombre visible a **Admisión**.
- Etapas intermedias (keys inmutables): `interes`, `contactado`, `orientacion`, `postulacion`, `en-revision`, `listo-matricular`. Inicial: `interes`.
- Resultados de plataforma sin cambio: `won`, `lost`, `archived`, `handed_off`.
- No reescribir `nextAction`, responsable ni historial de workflow; solo espejar `status` / `currentState` en el remap.
- Sin módulo Admisión aparte; ruta sigue `/admin/ventas`.
- No renombrar nav global CRM / Conversión.
- No tocar otros Espacios (ADL, etc.).
- Migración one-shot idempotente; ejecutar solo con `npm run migrate -- 030-sem-admision-funnel` (no `npm run migrate` a secas en prod).
- El archivo `029-growth-conversion-phase2.ts` existe pero **no** está en el registry; esta entrega **no** lo registra ni lo ejecuta. `030` se agrega al registry después de `028`.

## File structure

- Create: `src/core/growth/sem-admision-funnel.ts` — etapas SEM, detectores de ya-aplicado, `mapLegacyStatusToSemAdmision`.
- Create: `src/core/migrations/030-sem-admision-funnel.ts` — rename + replace stages + remap SEM.
- Create: `tests/baseline/sem-admision-funnel.test.ts` — puro + apply con directorio en memoria.
- Create: `tests/baseline/sem-admision-ventas-vista.test.ts` — parse de `vista`, sort cola, copy SEM.
- Modify: `src/core/growth/funnels.ts` — exportar `replaceGrowthFunnelStages`.
- Modify: `src/core/migrations/registry.ts` — registrar `030`.
- Modify: `src/lib/growth/ventas-read.ts` — ordenar `items` con `compareGrowthPriority`.
- Modify: `src/lib/growth/labels.ts` — helpers de copy SEM para Ventas.
- Modify: `src/app/admin/ventas/page.tsx` — default `cola`; pasar copy/labels.
- Modify: `src/components/admin/growth/VentasListClient.tsx` — vista `cola`, switcher, empty/copy props.
- Modify: `src/core/growth/index.ts` — reexportar símbolos SEM si el barrel ya exporta funnels.

---

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

### Task 2: `replaceGrowthFunnelStages` + apply SEM en memoria

**Files:**
- Modify: `src/core/growth/funnels.ts` — exportar `replaceGrowthFunnelStages` y `applySemAdmisionDefaultFunnel`
- Modify: `tests/baseline/sem-admision-funnel.test.ts` — casos con `createMemoryFunnelDirectory`

**Interfaces:**
- Consumes: `writeStages` (interno), `ensureGrowthFunnelsForTenant`, `renameGrowthFunnel`, `semAdmisionStages`, `isSemAdmisionStages`, `SEM_ADMISION_FUNNEL_NAME`, `GROWTH_FUNNEL_DEFAULT_KEY`
- Produces:
  - `replaceGrowthFunnelStages(directory, { tenantId, funnelKey, stages, now? })`
  - `applySemAdmisionDefaultFunnel(directory, tenantId, now?): Promise<{ funnel; stages; changed: boolean }>`

- [ ] **Step 1: Write the failing test**

Añadir al mismo archivo de test:

```ts
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import { ensureGrowthFunnelsForTenant } from "../../src/core/growth/funnels";
import { applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";

it("applySemAdmisionDefaultFunnel renombra default y deja etapas SEM; segunda pasada no cambia", async () => {
  const directory = createMemoryFunnelDirectory();
  await ensureGrowthFunnelsForTenant(directory, SEM_TENANT_ID, "2026-11-09T00:00:00.000Z");
  const first = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID, "2026-11-09T01:00:00.000Z");
  assert.equal(first.changed, true);
  assert.equal(first.funnel.name, "Admisión");
  assert.equal(isSemAdmisionStages(first.stages), true);

  const second = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID, "2026-11-09T02:00:00.000Z");
  assert.equal(second.changed, false);
  const def = await directory.getDefinition(SEM_TENANT_ID, first.funnel.workflowDefinitionKey);
  assert.equal(isSemAdmisionStages(stagesFromDefinition(def)), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: FAIL (`applySemAdmisionDefaultFunnel` / `replaceGrowthFunnelStages` missing)

- [ ] **Step 3: Write minimal implementation**

En `funnels.ts`, exportar:

```ts
export async function replaceGrowthFunnelStages(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    stages: GrowthFunnelStage[];
    now?: string;
  }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  const definition = await writeStages(directory, funnel, input.stages, nowIso(input.now));
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export async function applySemAdmisionDefaultFunnel(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  now?: string
): Promise<{ funnel: GrowthFunnel; stages: GrowthFunnelStage[]; changed: boolean }> {
  const at = nowIso(now);
  const funnel = await ensureGrowthFunnelsForTenant(directory, tenantId, at);
  let current = funnel;
  let changed = false;
  if (current.name !== SEM_ADMISION_FUNNEL_NAME) {
    const renamed = await renameGrowthFunnel(directory, {
      tenantId,
      key: current.key,
      name: SEM_ADMISION_FUNNEL_NAME,
      now: at,
    });
    if (renamed.ok) {
      current = renamed.funnel;
      changed = true;
    }
  }
  const existing = stagesFromDefinition(
    await directory.getDefinition(tenantId, current.workflowDefinitionKey)
  );
  if (isSemAdmisionStages(existing)) {
    return { funnel: current, stages: existing, changed };
  }
  const replaced = await replaceGrowthFunnelStages(directory, {
    tenantId,
    funnelKey: current.key,
    stages: semAdmisionStages(),
    now: at,
  });
  if (!replaced.ok) {
    return { funnel: current, stages: existing, changed };
  }
  return { funnel: current, stages: replaced.stages, changed: true };
}
```

Importar `SEM_ADMISION_FUNNEL_NAME`, `semAdmisionStages`, `isSemAdmisionStages` desde `./sem-admision-funnel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/growth/funnels.ts tests/baseline/sem-admision-funnel.test.ts
git commit -m "feat(growth): apply embudo Admisión SEM sobre funnel default"
```

---

### Task 3: Migración `030-sem-admision-funnel`

**Files:**
- Create: `src/core/migrations/030-sem-admision-funnel.ts`
- Modify: `src/core/migrations/registry.ts`
- Modify: `tests/baseline/sem-admision-funnel.test.ts` — test puro del loop de remap (sin Mongo): función exportada `remapSemAdmisionOpportunityStatuses`

**Interfaces:**
- Consumes: `SEM_TENANT_ID`; `createMongoGrowthFunnelDirectory`; `applySemAdmisionDefaultFunnel`; `mapLegacyStatusToSemAdmision`; `GROWTH_OPORTUNIDADES_COLLECTION`; `GROWTH_OPPORTUNITY_ENTITY_TYPE` (`opportunity-definition`)
- Produces: `migration030SemAdmisionFunnel`; `planSemAdmisionStatusRemaps(rows): Array<{ id; from; to }>`

- [ ] **Step 1: Write the failing test**

```ts
import { planSemAdmisionStatusRemaps } from "../../src/core/growth/sem-admision-funnel";

it("planSemAdmisionStatusRemaps solo lista abiertas legacy", () => {
  const plan = planSemAdmisionStatusRemaps([
    { _id: "1", status: "open" },
    { _id: "2", status: "won" },
    { _id: "3", status: "interes" },
    { _id: "4", status: "seguimiento" },
  ]);
  assert.deepEqual(plan, [
    { id: "1", from: "open", to: "interes" },
    { id: "4", from: "seguimiento", to: "contactado" },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: FAIL (`planSemAdmisionStatusRemaps` missing)

- [ ] **Step 3: Implement plan + migration + registry**

En `sem-admision-funnel.ts`:

```ts
export function planSemAdmisionStatusRemaps(
  rows: Array<{ _id: string; status: string }>
): Array<{ id: string; from: string; to: string }> {
  const out: Array<{ id: string; from: string; to: string }> = [];
  for (const row of rows) {
    const to = mapLegacyStatusToSemAdmision(row.status);
    if (!to || to === row.status) continue;
    out.push({ id: row._id, from: row.status, to });
  }
  return out;
}
```

Migración:

```ts
// src/core/migrations/030-sem-admision-funnel.ts
import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { applySemAdmisionDefaultFunnel } from "@/core/growth/funnels";
import { GROWTH_OPPORTUNITY_ENTITY_TYPE } from "@/core/growth/opportunity-definition";
import { planSemAdmisionStatusRemaps } from "@/core/growth/sem-admision-funnel";
import { GROWTH_OPORTUNIDADES_COLLECTION } from "@/core/growth/types";
import type { MigrationDefinition } from "@/core/migrations/types";
import { SEM_TENANT_ID } from "@/core/tenant/constants";

export const migration030SemAdmisionFunnel: MigrationDefinition = {
  id: "030-sem-admision-funnel",
  description: "Embudo Admisión SEM: etapas, rename default y remap de status abiertos",
  modules: [],
  async run({ db, log }) {
    const directory = createMongoGrowthFunnelDirectory(db);
    const applied = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID);
    log(`funnel name=${applied.funnel.name} changed=${applied.changed}`);

    const opps = await db
      .collection(GROWTH_OPORTUNIDADES_COLLECTION)
      .find({ tenantId: SEM_TENANT_ID }, { projection: { _id: 1, status: 1 } })
      .toArray();
    const plan = planSemAdmisionStatusRemaps(
      opps.map((row) => ({ _id: String(row._id), status: String(row.status ?? "") }))
    );
    let remapped = 0;
    for (const item of plan) {
      await db.collection(GROWTH_OPORTUNIDADES_COLLECTION).updateOne(
        { tenantId: SEM_TENANT_ID, _id: item.id },
        { $set: { status: item.to } }
      );
      await db.collection("workflow_instances").updateOne(
        {
          tenantId: SEM_TENANT_ID,
          entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
          entityId: item.id,
        },
        { $set: { currentState: item.to } }
      );
      remapped += 1;
      log(`remap opp=${item.id} ${item.from}->${item.to}`);
    }
    return {
      documentsAffected: Number(applied.changed) + remapped,
      skipped: opps.length - remapped,
      details: [
        `funnelChanged=${applied.changed}`,
        `remapped=${remapped}`,
        `opps=${opps.length}`,
      ],
    };
  },
};
```

En `registry.ts`: importar y añadir `migration030SemAdmisionFunnel` **después** de `migration028GrowthFunnels` (no registrar 029).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/growth/sem-admision-funnel.ts src/core/migrations/030-sem-admision-funnel.ts src/core/migrations/registry.ts tests/baseline/sem-admision-funnel.test.ts
git commit -m "feat(growth): migración 030 embudo Admisión SEM"
```

---

### Task 4: Orden de cola por prioridad comercial

**Files:**
- Modify: `src/lib/growth/ventas-read.ts` — tras `presentQueueItem`, ordenar con `compareGrowthPriority`
- Modify: `tests/baseline/sem-admision-ventas-vista.test.ts` (crear) — test del helper de sort si se extrae; si se ordena inline, testear vía función pura exportada

**Interfaces:**
- Consumes: `compareGrowthPriority`, `priorityInputFromOpportunity` (`priority.ts`)
- Produces: items de board/cola ordenados overdue → unfollowed → stale → current

Preferencia: extraer helper puro para testear sin I/O:

```ts
// en ventas-board.ts o ventas-view helpers
export function sortVentasQueueByPriority<
  T extends {
    status: string;
    nextActionLabel: string;
    hasNextAction: boolean;
    openedAt: string;
    updatedAt: string;
    lastActivityAt?: string;
    priorityBand: GrowthPriorityBand | null;
    priorityRank: number;
    priorityKey: number | null;
  }
>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    if (a.priorityKey != null && b.priorityKey != null && a.priorityKey !== b.priorityKey) {
      return a.priorityKey - b.priorityKey;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
```

Usar campos ya calculados en `GrowthVentasQueueItemView` (`priorityRank`, `priorityKey`) para no recalcular.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortVentasQueueByPriority } from "../../src/lib/growth/ventas-board";

describe("cola ventas por prioridad", () => {
  it("ordena overdue antes que unfollowed y current", () => {
    const sorted = sortVentasQueueByPriority([
      { id: "c", priorityRank: 3, priorityKey: null, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "a", priorityRank: 0, priorityKey: 1, updatedAt: "2026-11-01T00:00:00.000Z" },
      { id: "b", priorityRank: 1, priorityKey: 2, updatedAt: "2026-11-01T00:00:00.000Z" },
    ] as any);
    assert.deepEqual(sorted.map((i) => i.id), ["a", "b", "c"]);
  });
});
```

(Ajustar el tipo mínimo en el helper para no exigir todos los campos de la vista.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement helper + usarlo en `presentBoard` / al armar `items` en `readGrowthVentasBoard`**

Tras mapear `items`, antes de filtrar por banda o al devolver:

```ts
const items = sortVentasQueueByPriority(
  oportunidades
    .filter(...)
    .map(...)
);
```

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts tests/baseline/growth-ventas-board.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/ventas-board.ts src/lib/growth/ventas-read.ts tests/baseline/sem-admision-ventas-vista.test.ts
git commit -m "feat(ventas): ordenar cola por prioridad comercial"
```

---

### Task 5: Vista `cola` por defecto + switcher

**Files:**
- Modify: `src/app/admin/ventas/page.tsx`
- Modify: `src/components/admin/growth/VentasListClient.tsx`
- Modify: `tests/baseline/sem-admision-ventas-vista.test.ts`

**Interfaces:**
- Consumes: `searchParams.vista`
- Produces: `vista: "cola" | "kanban" | "lista"`; default sin param = `"cola"`

Parse helper puro (testable):

```ts
// src/lib/growth/ventas-vista.ts
export type GrowthVentasVista = "cola" | "kanban" | "lista";

export function parseGrowthVentasVista(raw: string | undefined | null): GrowthVentasVista {
  const value = raw?.trim().toLowerCase();
  if (value === "lista") return "lista";
  if (value === "kanban") return "kanban";
  return "cola";
}
```

- [ ] **Step 1: Write the failing test**

```ts
import { parseGrowthVentasVista } from "../../src/lib/growth/ventas-vista";

it("parseGrowthVentasVista default cola", () => {
  assert.equal(parseGrowthVentasVista(undefined), "cola");
  assert.equal(parseGrowthVentasVista(""), "cola");
  assert.equal(parseGrowthVentasVista("kanban"), "kanban");
  assert.equal(parseGrowthVentasVista("lista"), "lista");
  assert.equal(parseGrowthVentasVista("COLA"), "cola");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement parse + wire page + client**

1. Crear `ventas-vista.ts`.
2. En `page.tsx`: `const vista = parseGrowthVentasVista(params.vista);` (reemplaza el ternario actual).
3. En `VentasListClient`:
   - Tipo `vista: "cola" | "kanban" | "lista"`.
   - Switcher orden: **Cola · Kanban · Lista** (icono `ListOrdered` o `ClipboardList` de lucide para Cola).
   - `pushFilters`: si `vista === "cola"` omitir query `vista` (URL limpia = default); `lista`/`kanban` setean el param.
   - Render Cola: misma fila densa que Lista (persona, etapa/`statusLabel`, `nextActionLabel`, responsable, chip de `priorityBand`), lista vertical; empty states compartidos.
   - Limpiar filtros debe volver a `/admin/ventas` (cola), no a kanban.

Fragmento switcher:

```tsx
<button type="button" aria-pressed={vista === "cola"} onClick={() => pushFilters({ vista: "cola" })}>
  Cola
</button>
<button type="button" aria-pressed={vista === "kanban"} onClick={() => pushFilters({ vista: "kanban" })}>
  Kanban
</button>
<button type="button" aria-pressed={vista === "lista"} onClick={() => pushFilters({ vista: "lista" })}>
  Lista
</button>
```

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: PASS  
Smoke manual: `/admin/ventas` sin query muestra Cola activa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/ventas-vista.ts src/app/admin/ventas/page.tsx src/components/admin/growth/VentasListClient.tsx tests/baseline/sem-admision-ventas-vista.test.ts
git commit -m "feat(ventas): vista Cola por defecto con switcher"
```

---

### Task 6: Copy SEM en página Ventas

**Files:**
- Modify: `src/lib/growth/labels.ts` — `growthVentasPageCopy(tenantId)`
- Modify: `src/app/admin/ventas/page.tsx` — pasar copy al client
- Modify: `src/components/admin/growth/VentasListClient.tsx` — usar props en vez de constantes fijas de título/vacíos
- Modify: `tests/baseline/sem-admision-ventas-vista.test.ts`

**Interfaces:**
- Consumes: `isSemTenant`
- Produces:

```ts
export function growthVentasPageCopy(tenantId: string): {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  noMatchTitle: string;
  noMatchDescription: string;
} {
  if (isSemTenant(tenantId)) {
    return {
      title: "Admisión",
      description: "Postulantes y próximas acciones del Espacio.",
      emptyTitle: "Aún no hay postulantes en seguimiento",
      emptyDescription:
        "Cuando lleguen consultas o postulaciones, aparecerán aquí para darles seguimiento.",
      noMatchTitle: "No encontramos postulantes",
      noMatchDescription: "Prueba con otro nombre o quita los filtros.",
    };
  }
  return {
    title: GROWTH_VENTAS_PAGE_TITLE,
    description: GROWTH_VENTAS_PAGE_DESCRIPTION,
    emptyTitle: GROWTH_VENTAS_EMPTY_TITLE,
    emptyDescription: GROWTH_VENTAS_EMPTY_DESCRIPTION,
    noMatchTitle: GROWTH_VENTAS_NO_MATCH_TITLE,
    noMatchDescription: GROWTH_VENTAS_NO_MATCH_DESCRIPTION,
  };
}
```

- [ ] **Step 1: Write the failing test**

```ts
import { growthVentasPageCopy } from "../../src/lib/growth/labels";
import { SEM_TENANT_ID, ADL_TENANT_ID } from "../../src/core/tenant/constants";

it("copy SEM usa Admisión; otros Espacios conservan Ventas", () => {
  assert.equal(growthVentasPageCopy(SEM_TENANT_ID).title, "Admisión");
  assert.equal(growthVentasPageCopy(ADL_TENANT_ID).title, "Ventas");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement + wire props**

`VentasListClient` recibe `copy: ReturnType<typeof growthVentasPageCopy>` y lo usa en header, breadcrumbs label final, EmptyState de cola/lista/kanban vacío de board.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/labels.ts src/app/admin/ventas/page.tsx src/components/admin/growth/VentasListClient.tsx tests/baseline/sem-admision-ventas-vista.test.ts
git commit -m "feat(ventas): copy Admisión para Espacio SEM"
```

---

### Task 7: Verificación final

**Files:** none new (solo corridas)

- [ ] **Step 1: Suite focalizada**

Run:

```bash
npx tsx --test tests/baseline/sem-admision-funnel.test.ts tests/baseline/sem-admision-ventas-vista.test.ts tests/baseline/growth-ventas-board.test.ts tests/baseline/conversion-engine-fase-2.test.ts
```

Expected: PASS

- [ ] **Step 2: Baseline amplio si el entorno lo permite**

Run: `npm run test:baseline`  
Expected: PASS (o solo fallos preexistentes no relacionados; no introducir nuevos)

- [ ] **Step 3: Checklist manual SEM**

1. (Dev/staging) `npm run migrate -- 030-sem-admision-funnel` con autorización.
2. Embudos SEM: default **Admisión**, 6 etapas, inicial Interés.
3. `/admin/ventas` abre en **Cola**; Kanban muestra 6 columnas; Lista sigue filtrando.
4. Oportunidad legacy `open` aparece en Interés; una intermedia vieja en Contactado.
5. ADL (u otro tenant) sin cambio de copy ni etapas.

- [ ] **Step 4: Commit** solo si quedó algún ajuste de verificación; si no, no crear commit vacío.

---

## Self-review (plan vs spec)

| Spec | Task |
| --- | --- |
| Embudo 6 etapas + rename default Admisión | 1–2 |
| Migración SEM remap open/otras → interes/contactado | 3 |
| Cola default + switcher Cola·Kanban·Lista | 5 |
| Orden por atención / próxima acción | 4 |
| Copy SEM página Ventas | 6 |
| Sin segundo CRM / sin nav global / sin otros tenants | Constraints + Task 6/3 |
| Done when + tests | 7 |

Sin placeholders TBD. Tipos alineados: `GrowthVentasVista`, `mapLegacyStatusToSemAdmision`, `applySemAdmisionDefaultFunnel`, `030-sem-admision-funnel`.
