### Task 2: Repositorio — secuencia atómica + folio al crear + ensure

**Files:**
- Modify: `src/lib/congress/repository.ts`
- (sin test de integración Mongo en baseline; dominio cubierto en Task 1)

**Interfaces:**
- Consumes: `formatPaymentFolio`, `CONGRESS_COLLECTIONS.sequences`, `CONGRESS_EVENT_ID`, `CONGRESS_PAYMENT_FOLIO_YEAR`
- Produces:
  - `allocateNextPaymentFolio(tenantId: string): Promise<string>`
  - `ensureCongressPaymentFolio(input: { tenantId; paymentId }): Promise<{ ok: true; payment } | { ok: false; error }>`
  - `recordCongressPayment` → `payment.folio` siempre presente en éxito

- [ ] **Step 1: Añadir allocateNextPaymentFolio**

En `repository.ts`, tras imports existentes:

```ts
import { formatPaymentFolio } from "@/core/congress/payment-folio";
import { CONGRESS_PAYMENT_FOLIO_YEAR } from "@/core/congress/constants";
```

```ts
function paymentFolioSequenceId(tenantId: string, eventId = CONGRESS_EVENT_ID) {
  return `${tenantId}:${eventId}:payment-folio`;
}

export async function allocateNextPaymentFolio(tenantId: string): Promise<string> {
  const db = await getDatabase();
  const doc = await db
    .collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences)
    .findOneAndUpdate(
      { _id: paymentFolioSequenceId(tenantId) },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const seq = doc?.seq;
  if (!seq || !Number.isInteger(seq) || seq <= 0) {
    throw new Error("folio_sequence_failed");
  }
  return formatPaymentFolio(seq, CONGRESS_PAYMENT_FOLIO_YEAR);
}
```

Nota: el driver Mongo puede devolver el documento en `doc` o `doc.value` según versión — usar el patrón ya existente en este repo para `findOneAndUpdate` (ver `updateCongressRegistration` en el mismo archivo) y adaptar.

In this repo, `updateCongressRegistration` uses:
```ts
return result ? normalizeCongressRegistration(result) : null;
```
So treat `findOneAndUpdate` return as the document directly (not `.value`).

- [ ] **Step 2: Asignar folio en recordCongressPayment antes de insertOne**

Dentro de `recordCongressPayment`, **después** de `allocatePayment` OK, asignar folio **antes** del loop de updates a registrations:

```ts
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  let folio: string;
  try {
    folio = await allocateNextPaymentFolio(input.tenantId);
  } catch {
    return { ok: false, error: "folio_sequence_failed" };
  }

  const paymentWithFolio: CongressPayment = { ...result.payment, folio };
```

Usar `paymentWithFolio` en el `insertOne` y en el return. El loop de `updatedRegistrations` sigue igual.

Si el loop de registrations falla (`concurrent_payment`), el folio queda “consumido” (hueco en secuencia) — aceptable (no reutilizar).

- [ ] **Step 3: ensureCongressPaymentFolio**

Implement idempotent ensure for legacy payments without folio. Prefer a clean race-safe version:

1. find payment; if missing → not_found; if has folio → return it
2. allocateNextPaymentFolio
3. findOneAndUpdate only when folio is null/missing/empty; returnDocument after
4. if update lost race, findOne again and return existing folio if present; else folio_sequence_failed

Do not leave dead unreachable branches (the plan's sample had a redundant `if (payment?.folio)` inside `if (!payment?.folio)` — clean that up).

- [ ] **Step 4: Smoke / typecheck**

Prefer focused check: ensure repository.ts typechecks. If full `npx tsc --noEmit -p tsconfig.json` is too noisy/slow, at least confirm no TS errors in the edited file via reading lints / compiling if feasible. Report what you ran.
