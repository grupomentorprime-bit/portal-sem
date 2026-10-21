# Task 2: Contenido editorial en `proteccion-datos` — Report

**Status:** GREEN

## Changes

- Modified `src/sites/cumple/pages/materias.ts` (`slug: "proteccion-datos"`).
- Added optional editorial blocks per brief: `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps`.
- Preserved: `titleName` "Protección de datos", `mark` ["DATOS"], `markTone` "ink", `sources: [BCN.ley19628]`, existing `exige` / `implica` / `cumple` / `lead`.
- `heroAside.source` and `sources` use BCN.ley19628 (URL contains `141599`).
- No changes to `inclusion-laboral` or `contratistas-terceros`.

## Test evidence

```text
npx tsx --test tests/baseline/cumple-pages.test.ts
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

Relevant case: **"Protección de datos incluye el mismo patrón editorial que Ley Karin"** — PASS.

## Commits

None (per task constraint).

## Visual verification

Not run in this session; URL: `http://cumple.localhost:3000/materias/proteccion-datos`.

## Concerns

None. Copy avoids ley posterior and multas; icons use `folder`, `list`, `check` as specified.
