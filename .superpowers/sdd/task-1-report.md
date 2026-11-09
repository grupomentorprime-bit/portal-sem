# Task 1 Report: Modelo puro SEM + remap

## Goal
Implement the pure SEM Admisión funnel helpers and the legacy status remap helper, with no UI or migration work.

## What changed
- Added `src/core/growth/sem-admision-funnel.ts`.
- Added `tests/baseline/sem-admision-funnel.test.ts`.
- Exported the new SEM Admisión helpers from `src/core/growth/index.ts`.

## TDD Evidence

### RED
Test file added first:
`tests/baseline/sem-admision-funnel.test.ts`

Verified failure:
- Command: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
- Result: failed as expected with `Cannot find module '../../src/core/growth/sem-admision-funnel'`

### GREEN
Implemented the minimal helper module and barrel export:
- `SEM_ADMISION_FUNNEL_NAME = "Admisión"`
- `SEM_ADMISION_STAGE_KEYS` with the six SEM stages
- `semAdmisionIntermediateStages()`
- `semAdmisionStages()`
- `isSemAdmisionStages()`
- `mapLegacyStatusToSemAdmision()`

Verified passing:
- Command: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`
- Result: pass

## Verification
- Focused test file passed after implementation.
- Lint diagnostics for edited files: no errors.

## Commit
- `5de113c` `feat(growth): modelo puro embudo Admisión SEM`

## Notes
- The worktree still has unrelated pre-existing modifications in `.superpowers/sdd/progress.md` and `.superpowers/sdd/task-1-brief.md`; դրանք were left untouched.
# Task 1 — Núcleo puro y pruebas de aceptación

Status: DONE_WITH_CONCERNS (decisiones de interpretación abajo)

## Commit
- `37696a0` feat: calcular analítica de conversión desde el núcleo Growth (rama `feat/branding-admin-wip`)

## Archivos (solo estos tres en el commit)
- `src/lib/growth/conversion-analytics.ts` (nuevo): `buildConversionAnalytics`, constantes `CONVERSION_DENOMINATORS`, `CONVERSION_RATE_NOTE`, `CONVERSION_LOSS_REASONS_NOTE`, todos los tipos del brief más `ConversionMovementRow`, `ConversionDwellRow`, `ConversionCycleStat`, `ConversionAnalyticsResponse`, y `medianOf`.
- `src/lib/growth/index.ts`: reexporta función, constantes y tipos. El diff de este archivo contenía solo mis líneas.
- `tests/baseline/growth-conversion-analytics.test.ts` (nuevo): 19 pruebas, cubren los 9 puntos del brief.

## Evidencia TDD
- RED: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts` → falló con `Cannot find module '../../src/lib/growth/conversion-analytics'` (`MODULE_NOT_FOUND`). Falla por módulo inexistente, como se esperaba.
- GREEN: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-analytics-003.test.ts` → tests 45, pass 45, fail 0.
- `npx tsc --noEmit -p .` sin errores.

## Forma de la respuesta (para tareas 2 y 3)
- `movement`: `{ byFunnel: [{ funnelKey, funnelLabel, stages: ConversionMovementRow[] }], ilegible }`. Fila: `key` (etapa de salida), `label`, `advance`, `lost`, `won`, `handedOff`, `archived`, `opportunities` (distintas).
- `dwell`: `{ byFunnel: [{ funnelKey, funnelLabel, stages: { key, label, medianMs, count, inProgress }[] }] }`.
- `cycle`: `{ won: { medianMs, count }, lost: { medianMs, count } }`.
- `losses.byExitStage`: `key` es `funnelKey:fromState` (las etapas de embudos distintos no se mezclan), `label` es la etiqueta de etapa.
- Embudo sin `funnelKey`: clave `sin-embudo`, label «Sin embudo». `funnelLabel` de un embudo con clave es la clave, porque `ConversionFunnelInput` no trae nombre.
- Campaña no registrada: key `campana-no-registrada`.

## Decisiones donde el brief no es literal (revisar)
1. Un resultado (`won`/`lost`/`handed_off`) sin `closedAt` queda fuera de la cohorte entera (numerador y denominador), porque el contrato dice «fuera de tasas» y «no altera la tasa». Sigue contando en captación.
2. Actividades cuya `oportunidadId` no corresponde a una oportunidad del Espacio en la entrada se ignoran (también para `movimientoIlegible`).
3. Historial incompleto, además de las causas del contrato: la `fromState` de una transición no coincide con la etapa anterior del recorrido (cadena rota), transición sin `occurredAt` válido, y no poder determinar la primera etapa (sin `payload.status` en la apertura ni transiciones). Una oportunidad sin ninguna actividad de apertura/transición cae en este cubo.
4. `historialIncompleto`, `sinFechaApertura` y `sinFechaCierre` cuentan sobre todas las oportunidades del Espacio, no solo las del período.
5. La etapa de un intervalo de permanencia que es un resultado no se mide. Si el `status` no es resultado y no hay `closedAt`, el intervalo cuenta en «en curso».

## Autorrevisión
- Aislamiento por `tenantId` en oportunidades, actividades, embudos y campañas. No hay campo de motivo en la entrada. `lossReasonKey` no aparece en el archivo de producción (lo verifica un test).
- Atribución de cierre con `closureOwnerUserId` del brief: nunca usa `ownerUserId` actual ni asignaciones posteriores. «Sin responsable» (abiertas) y «Sin atribución de responsable» (cierres) son filas distintas.
- Archivadas: suman en captación y `archivedNow` (subconjunto, no corte extra); fuera de cohorte.
- No se tocaron otros archivos, migración 029, git config, ni datos. Sin push.
- Los archivos nuevos se guardaron con LF; git avisa que los convertirá a CRLF (comportamiento del repo en Windows).

## Review Fix Notes
- `isSemAdmisionStages()` now requires both the six SEM intermediates and the four platform result stages.
- Added a regression test covering the intermediates-only case so the validator fails when result stages are missing.

## Test Command
- `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`

## Test Output
- Initial run failed on `returns false for intermediates without result stages` with `true !== false`.
- After the fix, the focused test suite passed: 3 tests, 0 failures.
