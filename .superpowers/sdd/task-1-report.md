# Task 1 Report: Dominio puro — tipo, etiqueta y merge

## Status

**DONE**

## Commits

None (per global plan constraints).

## TDD

1. Created `tests/baseline/congress-form-submitted-at.test.ts` verbatim from brief.
2. Ran tests — 4 failures (`formSubmissionDisplay` / `withFormSubmittedAt` not exported).
3. Implemented type field and helpers per brief.
4. Re-ran tests — 4/4 pass.

```
npx tsx --test tests/baseline/congress-form-submitted-at.test.ts
ℹ pass 4, fail 0
```

## Changes

### `src/core/congress/types.ts`

- Added optional `formSubmittedAt?: string | null` on `CongressRegistration` after `submissionId`, with JSDoc noting API-only enrichment (not persisted).

### `src/core/congress/form-engagement.ts`

- `formSubmissionDisplay(reg)` — returns `{ label, at }`:
  - No trimmed non-empty `formSubmittedAt` → `{ label: null, at: null }`.
  - `source === "form"` → `"Formulario"`.
  - Otherwise → `"Actualización"`.
- `withFormSubmittedAt(regs, map)` — maps each registration, setting `formSubmittedAt` from map by trimmed `submissionId`, or `null` when no id or no map entry.

### `tests/baseline/congress-form-submitted-at.test.ts`

- New baseline suite covering display labels (form / actualización / sin hora) and merge behavior.

## Self-review

- Matches brief verbatim; no unrelated files touched.
- Aligns with existing `form-engagement.ts` patterns (`Pick<CongressRegistration, ...>`, Spanish labels consistent with file comments).
- `withFormSubmittedAt` returns new objects via spread (immutable merge).
- Linter: no issues on modified files.

## Concerns

None.

## Out of scope (later tasks)

- Mongo/API wiring to populate `formSubmittedAt` when listing.
- UI (ReceptionView, CongressOpsPanel).
## Final-review fix

**Problem:** `submissionId` can be a Mongo ObjectId at runtime (`sync-form.ts` wrote `submission._id` raw), so `id.trim()` / `reg.submissionId?.trim()` crashed GET `/api/congress/registrations`.

**Changes**
- `src/core/congress/form-engagement.ts`: new pure `submissionIdKey(value: unknown): string | null` (string -> trim; object -> toHexString/String(); null/empty/`[object Object]`/invalid -> null). `withFormSubmittedAt` uses it.
- `src/lib/congress/form-submitted-at.ts`: loader takes `readonly unknown[]` and normalizes with `submissionIdKey`; map keys remain strings.
- `src/lib/congress/sync-form.ts`: writes `String(submission._id)` (both insert and link-by-RUT update); the dedupe lookup uses `$in: [string, rawId]` so legacy ObjectId rows still match (no duplicates).
- `src/app/api/congress/registrations/route.ts`: passes `items.map(r => r.submissionId)` directly (loader coerces).
- `tests/baseline/congress-form-submitted-at.test.ts`: added ObjectId-like / toString-only / padded / `{}` / number cases and `submissionIdKey` tests.

**Test output** (`npx tsx --test tests/baseline/congress-form-submitted-at.test.ts`): tests 6, pass 6, fail 0. `tsc --noEmit` reports no errors in touched files. No commit made; ReceptionView untouched.
