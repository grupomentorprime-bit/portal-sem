# Task 1 report: Test editorial Inclusión laboral (TDD RED)

**Date:** 2026-10-03  
**Scope:** `tests/baseline/cumple-pages.test.ts` only  
**Commits:** none (per instructions)

## Changes applied

1. Extended the SST editorial guard `Set` with `"inclusion-laboral"` so the non-editorial materias guard does not expect `inclusion-laboral` to lack editorial blocks before implementation.
2. Added test: `Inclusión laboral incluye el mismo patrón editorial que Ley Karin`.

## Test run

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

| Metric   | Value |
|----------|-------|
| Total    | 24    |
| Pass     | 23    |
| Fail     | 1     |
| Exit     | 1     |

## RED evidence

**Failing test:** `Inclusión laboral incluye el mismo patrón editorial que Ley Karin`

```
AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert.ok(inc?.concepts)

  at tests/baseline/cumple-pages.test.ts:252:12
  actual: undefined
  expected: true
  operator: '=='
```

**Interpretation:** `getMateria("inclusion-laboral")` resolves and passes early assertions (`titleName`, `mark`, `markTone`), but `concepts` (and downstream editorial fields: `baton`, `heroAside`, `checklist`, `implicaPoints`, `processSteps`) are not defined in `materias.ts` yet. Task 2 should add the Ley Karin–style editorial payload for `inclusion-laboral`.

## TDD status

**RED** — confirmed. Ready for implementation task.
