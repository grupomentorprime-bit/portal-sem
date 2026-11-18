### Task 1: Dominio — folio puro + tipo

**Files:**
- Modify: `src/core/congress/types.ts`
- Modify: `src/core/congress/constants.ts`
- Create: `src/core/congress/payment-folio.ts`
- Create: `tests/baseline/congress-payment-folio.test.ts`

**Interfaces:**
- Produces:
  - `CONGRESS_PAYMENT_FOLIO_YEAR = 2026`
  - `CONGRESS_COLLECTIONS.sequences = "congress_sequences"`
  - `formatPaymentFolio(seq: number, year?: number): string` → `CV-2026-00042`
  - `paymentReceiptFilename(folio: string): string` → `comprobante-ingreso-CV-2026-00042.pdf`
  - `CongressPayment.folio?: string | null`

- [ ] **Step 1: Test fallido — formato y filename**

Crear `tests/baseline/congress-payment-folio.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPaymentFolio,
  paymentReceiptFilename,
} from "../../src/core/congress/payment-folio";

describe("congress payment folio", () => {
  it("formatea CV-YYYY-##### con padding", () => {
    assert.equal(formatPaymentFolio(42), "CV-2026-00042");
    assert.equal(formatPaymentFolio(1, 2026), "CV-2026-00001");
  });

  it("rechaza secuencia no positiva", () => {
    assert.throws(() => formatPaymentFolio(0));
    assert.throws(() => formatPaymentFolio(-1));
  });

  it("arma nombre de archivo estable", () => {
    assert.equal(
      paymentReceiptFilename("CV-2026-00042"),
      "comprobante-ingreso-CV-2026-00042.pdf"
    );
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

Run: `npx tsx --test tests/baseline/congress-payment-folio.test.ts`  
Expected: FAIL (módulo / exports ausentes)

- [ ] **Step 3: Implementar constantes, tipo y helpers**

En `constants.ts`:

```ts
/** Año fijo del folio de comprobantes del Congreso 2026. */
export const CONGRESS_PAYMENT_FOLIO_YEAR = 2026;
```

En `CONGRESS_COLLECTIONS`:

```ts
  sequences: "congress_sequences",
```

En `CongressPayment` (`types.ts`):

```ts
  /** Folio correlativo CV-YYYY-#####. Requerido en pagos nuevos. */
  folio?: string | null;
```

Crear `payment-folio.ts`:

```ts
import { CONGRESS_PAYMENT_FOLIO_YEAR } from "@/core/congress/constants";

export function formatPaymentFolio(
  seq: number,
  year: number = CONGRESS_PAYMENT_FOLIO_YEAR
): string {
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error("invalid_folio_sequence");
  }
  return `CV-${year}-${String(seq).padStart(5, "0")}`;
}

export function paymentReceiptFilename(folio: string): string {
  return `comprobante-ingreso-${folio}.pdf`;
}
```

- [ ] **Step 4: Correr test — debe pasar**

Run: `npx tsx --test tests/baseline/congress-payment-folio.test.ts`  
Expected: PASS
