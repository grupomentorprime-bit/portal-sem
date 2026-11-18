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
