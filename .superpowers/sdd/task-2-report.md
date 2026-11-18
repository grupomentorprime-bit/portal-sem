# Task 2 - replaceGrowthFunnelStages + applySemAdmisionDefaultFunnel

Status: DONE

## Archivos
- Modificado: `src/core/growth/funnels.ts`
- Modificado: `tests/baseline/sem-admision-funnel.test.ts`

## RED
`npx tsx --test tests/baseline/sem-admision-funnel.test.ts`

Primero fallo por falta de export:
`TypeError: (0 , import_funnels.applySemAdmisionDefaultFunnel) is not a function`

## GREEN
El mismo comando paso completo:
- 4 tests
- 0 fallos

## Implementacion
- `replaceGrowthFunnelStages(directory, { tenantId, funnelKey, stages, now? })` busca el funnel, reusa `writeStages` y devuelve las etapas persistidas; si no encuentra el funnel, devuelve `not_found`.
- `applySemAdmisionDefaultFunnel(directory, tenantId, now?)` asegura el funnel default, renombra a `Admisión` cuando hace falta, y reemplaza sus etapas por `semAdmisionStages()` solo si todavia no son SEM.
- Si el funnel ya tiene nombre y etapas SEM, devuelve `changed: false`.

## Verificacion
- `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
- `ReadLints` sobre `src/core/growth/funnels.ts` y `tests/baseline/sem-admision-funnel.test.ts`: sin errores

## Commit
- `ed0d606` - `feat(growth): apply embudo Admisión SEM sobre funnel default`
