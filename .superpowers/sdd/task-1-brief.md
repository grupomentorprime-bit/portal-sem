### Task 1: Helpers de filtros de mesa

**Files:**
- Modify: `src/lib/desktop/help-origins.ts` (tras `filterDeskCases`)
- Create or Modify: `tests/baseline/desktop-attention-filters.test.ts`

**Interfaces:**
- Produces:
  - `export type DeskFilterFields = { tenantId: string; originId: string; status: string; priority: string; assigneeUserId: string }`
  - `export function emptyDeskFilters(): DeskFilterFields`
  - `export function countAppliedDeskFilters(fields: DeskFilterFields): number`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-attention-filters.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countAppliedDeskFilters,
  emptyDeskFilters,
} from "../../src/lib/desktop/help-origins";

describe("filtros de bandeja Atención (mesa)", () => {
  it("vacío cuenta 0", () => {
    assert.equal(countAppliedDeskFilters(emptyDeskFilters()), 0);
  });

  it("cuenta solo campos con valor", () => {
    assert.equal(
      countAppliedDeskFilters({
        tenantId: "mentor-prime-capacitacion",
        originId: "",
        status: "pendiente",
        priority: "",
        assigneeUserId: "u1",
      }),
      3
    );
  });

  it("emptyDeskFilters deja todos los campos en cadena vacía", () => {
    assert.deepEqual(emptyDeskFilters(), {
      tenantId: "",
      originId: "",
      status: "",
      priority: "",
      assigneeUserId: "",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: FAIL (exports missing)

- [ ] **Step 3: Write minimal implementation**

In `src/lib/desktop/help-origins.ts`, after `filterDeskCases`:

```ts
export type DeskFilterFields = {
  tenantId: string;
  originId: string;
  status: string;
  priority: string;
  assigneeUserId: string;
};

export function emptyDeskFilters(): DeskFilterFields {
  return {
    tenantId: "",
    originId: "",
    status: "",
    priority: "",
    assigneeUserId: "",
  };
}

export function countAppliedDeskFilters(fields: DeskFilterFields): number {
  return [
    fields.tenantId,
    fields.originId,
    fields.status,
    fields.priority,
    fields.assigneeUserId,
  ].filter(Boolean).length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: PASS

---

