# Task 1 Report: Dominio — folio puro + tipo

## Status

**DONE**

## Scope

Pure domain helpers for congress payment receipt folios, year constant, sequences collection name on `CONGRESS_COLLECTIONS`, and optional `folio` on `CongressPayment`. No Mongo sequence wiring, migrations, or PDF UI (later tasks).

## Files changed

| Action | Path |
|--------|------|
| Create | `tests/baseline/congress-payment-folio.test.ts` |
| Create | `src/core/congress/payment-folio.ts` |
| Modify | `src/core/congress/constants.ts` |
| Modify | `src/core/congress/types.ts` |

## Implementation summary

### `constants.ts`

- Added `CONGRESS_PAYMENT_FOLIO_YEAR = 2026` with JSDoc (Spanish, per brief).
- Added `sequences: "congress_sequences"` to `CONGRESS_COLLECTIONS`.

### `types.ts`

- Added `folio?: string | null` on `CongressPayment` with brief JSDoc, placed after `receiptRef`.

### `payment-folio.ts`

- `formatPaymentFolio(seq, year?)` — default year from `CONGRESS_PAYMENT_FOLIO_YEAR`; validates positive integer; throws `Error("invalid_folio_sequence")` otherwise; returns `CV-{year}-{5-digit}`.
- `paymentReceiptFilename(folio)` — returns `comprobante-ingreso-{folio}.pdf`.

## TDD evidence

### RED — Step 2 (module absent)

**Command:**

```text
npx tsx --test tests/baseline/congress-payment-folio.test.ts
```

**Result:** exit code 1

```text
Error: Cannot find module '../../src/core/congress/payment-folio'
...
ℹ pass 0
ℹ fail 1
```

### GREEN — Step 4 (after implementation)

**Command:**

```text
npx tsx --test tests/baseline/congress-payment-folio.test.ts
```

**Result:** exit code 0

```text
▶ congress payment folio
  ✔ formatea CV-YYYY-##### con padding
  ✔ rechaza secuencia no positiva
  ✔ arma nombre de archivo estable
✔ congress payment folio
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## Self-review

- Matches task brief verbatim (no extra exports, validators, or runtime DB usage).
- Test file mirrors brief exactly (relative import to `payment-folio`; `@/` import in source matches other congress modules).
- Linter: no issues on touched source files.
- `folio` remains optional on the type for legacy payments; enforcement is deferred to later tasks.

## Commits

None (per project constraint for this workstream).

## Concerns

None.