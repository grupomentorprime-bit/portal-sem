# Task 2 report: Contenido editorial Inclusión laboral

**Date:** 2026-10-03  
**Scope:** `src/sites/cumple/pages/materias.ts` (`inclusion-laboral` only)  
**Commits:** none (per instructions)

## Changes applied

Added editorial opcionales to `inclusion-laboral`:

- `baton`: Umbral · Cuota · Evidencia
- `heroAside`: Lo esencial, Ley 21.015, duties, `source: BCN.ley21015` (idNorma 1103997)
- `concepts`: three items (Umbral sand, Cuota ink, Evidencia hot); no invented cálculo anual/sanciones
- `checklist`, `implicaPoints`, `processSteps` per brief

Preserved: `mark: ["INCLUSIÓN"]`, `markTone: "sand"`, `sources: [BCN.ley21015, BCN.codigoTrabajo]`.  
**Not modified:** `contratistas-terceros` or other materias.

## Test run

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

| Metric | Value |
|--------|-------|
| Total  | 24    |
| Pass   | 24    |
| Fail   | 0     |
| Exit   | 0     |

**GREEN** — `Inclusión laboral incluye el mismo patrón editorial que Ley Karin` passes.

## Visual check

Manual: `/materias/inclusion-laboral` (not run in this session).

## TDD status

Task 1 RED → Task 2 GREEN complete.
