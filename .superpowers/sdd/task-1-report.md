# Task 1 Report: Test editorial Laboral (falla primero)

## What I did

1. Updated the editorial slug guard in `"SST / DS 44 incluye el mismo patrón editorial que Ley Karin"` so `laboral-rrhh` is treated like Karin and SST (non-editorial materias must still lack `concepts`, `checklist`, `implicaPoints`, `processSteps`, `baton`, and `heroAside`).
2. Added a new test `"Laboral y RR.HH. incluye el mismo patrón editorial que Ley Karin"` immediately after the SST test, using the exact assertions from the task brief.

## TDD RED evidence

**Command:**

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

**Result:** exit code 1 — 21 pass, 1 fail.

**Failing test:** `Laboral y RR.HH. incluye el mismo patrón editorial que Ley Karin`

**Failure output (excerpt):**

```
AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:

  assert.ok(lab?.concepts)

  at TestContext.<anonymous> (...\tests\baseline\cumple-pages.test.ts:182:12)
  actual: undefined
  expected: true
  operator: '=='
```

This matches the brief expectation: Laboral lacks editorial fields (`concepts`, and downstream `baton`, `heroAside`, etc.) until Task 2 implements them in `materias.ts`.

## Files changed

| File | Change |
|------|--------|
| `tests/baseline/cumple-pages.test.ts` | Editorial `Set` + new Laboral editorial test |

No changes to `src/sites/cumple/pages/materias.ts` (per task scope).

## Self-review

- Only `tests/baseline/cumple-pages.test.ts` was modified, as specified.
- Editorial set values match the brief verbatim: `["ley-karin", "seguridad-salud-trabajo", "laboral-rrhh"]`.
- New test body matches the brief verbatim.
- SST guard test still passes: excluding `laboral-rrhh` from the “must not have editorial fields” loop avoids a false failure while Laboral has no editorial blocks yet.
- First failing assertion is `assert.ok(lab?.concepts)` — appropriate RED for Task 2.
- No git commit (user instruction).

## Concerns

- None blocking. Task 2 must add full editorial payload for `laboral-rrhh` (concepts with reglamento/jornada/evidencia, baton labels, heroAside with 207436 source, checklist, implicaPoints, processSteps, and source URL containing 207436) to turn this test green.
