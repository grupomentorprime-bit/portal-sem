# Task 3 report

**Status:** DONE (sin commit; browser smoke omitido)

## Cambios
- `CongressOpsPanel.tsx`: `upsertRegistration` conserva `formSubmittedAt` previo si la respuesta no lo trae (según brief). WIP de ToastProvider / CongressOpsPanelInner intacto.
- `ReceptionView.tsx`: imports `formSubmissionDisplay` / `formatDateTimeSantiago`; `<th>` Formulario entre Alojamiento y Acción; `const form = formSubmissionDisplay(reg)` calculado una vez por fila (desktop y móvil, sin IIFE); celda desktop (fecha + etiqueta, o "—"); móvil línea bajo el nombre ("Formulario · fecha" / "Sin formulario"). WIP de columna N°, `entryNumbersForDay`, `compareByEntryOrder` intacto.
- `ParticipantSheet.tsx`: import `formSubmissionDisplay` (`formatDateTimeSantiago` ya importado); `formDisplay` calculado una vez; línea tras el bloque nombre/roles y antes de "Previsto:".

## Verificación
- `npx tsx --test tests/baseline/congress-form-submitted-at.test.ts`: 4/4 PASS.
- `npx tsc --noEmit`: sin errores en los archivos tocados.
- Smoke en navegador (Step 4): no realizado (requiere login admin).

## Notas
- La tabla mantiene `min-w-[64rem]`; con la columna extra hay scroll horizontal algo antes (no ajustado).
- Línea de ficha visible en ambos modos (operate o solo lectura).
- No se hizo commit.
