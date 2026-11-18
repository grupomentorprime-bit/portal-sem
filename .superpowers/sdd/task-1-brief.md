### Task 1: Predicado `isGroupPaymentSelectable`

**Files:**
- Modify: `src/core/congress/finance-status.ts`
- Test: `tests/baseline/congress-reception-labels.test.ts`

**Interfaces:**
- Consumes: `deriveContributionStatus(reg)`
- Produces: `isGroupPaymentSelectable(reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">): boolean` — `true` solo si status === `"pending"`

- [ ] **Step 1: Write the failing test**

En `tests/baseline/congress-reception-labels.test.ts`, añadir import y bloque:

```ts
import {
  deriveContributionStatus,
  isGroupPaymentSelectable,
} from "../../src/core/congress/finance-status";

describe("group payment selectable", () => {
  const base = {
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    needsReview: false,
  };

  it("solo pending es seleccionable en pago grupal", () => {
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 0 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: 5000,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      false
    );
  });
});
```

Actualizar el import existente de `deriveContributionStatus` para incluir `isGroupPaymentSelectable` (un solo import desde ese módulo).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/congress-reception-labels.test.ts`

Expected: FAIL — `isGroupPaymentSelectable` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

En `src/core/congress/finance-status.ts`, después de `contributionStatusHasBalance`:

```ts
/** Pago grupal: solo pendientes sin imputar (monto completo, sin abonos). */
export function isGroupPaymentSelectable(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
): boolean {
  return deriveContributionStatus(reg) === "pending";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-reception-labels.test.ts`

Expected: PASS (todos los `describe` del archivo).

- [ ] **Step 5: Commit**

```bash
git add src/core/congress/finance-status.ts tests/baseline/congress-reception-labels.test.ts
git commit -m "feat(congreso): predicado de selección para pago grupal sin duplicar."
```

---

