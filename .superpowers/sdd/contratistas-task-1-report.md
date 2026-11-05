# Task 1 report: Test editorial Contratistas (RED)

## Status

**RED complete.** Baseline test added; implementation not started.

## Changes

- **File:** `tests/baseline/cumple-pages.test.ts`
  - Added `"contratistas-terceros"` to the editorial `Set` in the SST editorial-pattern guard test.
  - Added `it("Contratistas y terceros incluye el mismo patrón editorial que Ley Karin", …)` per brief.

## Test run

```text
npx tsx --test tests/baseline/cumple-pages.test.ts
```

| Metric | Value |
|--------|-------|
| Total  | 25    |
| Pass   | 24    |
| Fail   | 1     |

**Failing test:** `Contratistas y terceros incluye el mismo patrón editorial que Ley Karin`

**First assertion failure:** `assert.ok(c?.concepts)` — `concepts` is `undefined` on `getMateria("contratistas-terceros")`.

**Current materia state (reference):** `contratistas-terceros` in `materias.ts` has `titleName`, `mark`, `markTone`, `normRef`, and classic sections (`exige` / `implica` / `cumple`) but no editorial blocks (`concepts`, `baton`, `heroAside`, `checklist`, `implicaPoints`, `processSteps`).

## Commits

None (per task instructions).

## Next (Task 2+)

Implement editorial content on `contratistas-terceros` in `materias.ts` until the new test passes.
