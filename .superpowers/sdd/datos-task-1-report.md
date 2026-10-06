# Task 1 report: Test editorial Protección de datos (TDD RED)

**Date:** 2026-10-02  
**Scope:** `tests/baseline/cumple-pages.test.ts` only  
**Commits:** none (per instructions)

## Changes applied

1. Extended the SST editorial guard `Set` with `"proteccion-datos"` so the non-editorial materias guard does not expect `proteccion-datos` to lack editorial blocks before implementation.
2. Added test: `Protección de datos incluye el mismo patrón editorial que Ley Karin`.

## Test run

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

| Metric   | Value |
|----------|-------|
| Total    | 23    |
| Pass     | 22    |
| Fail     | 1     |
| Exit     | 1     |

## RED evidence

**Failing test:** `Protección de datos incluye el mismo patrón editorial que Ley Karin`

```
AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert.ok(datos?.concepts)

  at tests/baseline/cumple-pages.test.ts:219:12
  actual: undefined
  expected: true
  operator: '=='
```

**Interpretation:** `getMateria("proteccion-datos")` resolves and passes early assertions (`titleName`, `mark`, `markTone`), but `concepts` (and downstream editorial fields: `baton`, `heroAside`, `checklist`, `implicaPoints`, `processSteps`) are not defined in `materias.ts` yet. Task 2 should add the Ley Karin–style editorial payload for `proteccion-datos`.

## TDD status

**RED** — confirmed. Ready for implementation task.
