# Task 2 report: Contenido editorial Contratistas y terceros

**Date:** 2026-10-05  
**Scope:** `src/sites/cumple/pages/materias.ts` (`contratistas-terceros` only)  
**Commits:** none (per instructions)

## Changes applied

Added editorial opcionales to `contratistas-terceros`:

- `baton`: Empresa principal · Faena · Control (`building`, `shield`, `clipboard`)
- `heroAside`: Lo esencial, marco Ley 20.123 · Ley 16.744, duties, `source: BCN.ley20123` (idNorma 254080)
- `concepts`: three items (Empresa principal hot, Protección en faena ink, Documentos y control sand); no lista cerrada de documentos ni montos de multa
- `checklist`, `implicaPoints`, `processSteps` per brief

Preserved: `mark: ["TERCEROS"]`, `markTone: "hot"`, `sources: [BCN.ley20123, BCN.ley16744]` (254080 + 28650).

## Test run

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

| Metric | Value |
|--------|-------|
| Total  | 25    |
| Pass   | 25    |
| Fail   | 0     |
| Exit   | 0     |

**GREEN** — `Contratistas y terceros incluye el mismo patrón editorial que Ley Karin` passes.

## Visual check

Manual: `/materias/contratistas-terceros` (not run in this session).

## TDD status

Task 1 RED → Task 2 GREEN complete.
