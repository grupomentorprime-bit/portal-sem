# Task 6 report: Alojamiento en dos respuestas

Status: DONE

## Cambio
Archivo: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alojamiento"`).

Encima del `Select` "Necesidad" se añadió un bloque condicionado a
`operate && (registration.lodgingNeed ?? "unknown") === "unknown"` con dos botones, tal como el brief:
- `No requiere` (primario) -> `onPatchRegistration(registration._id, { lodgingNeed: "none" })`
- `Necesita cama` (outline) -> `onPatchRegistration(registration._id, { lodgingNeed: "requested" })`

Ambos con `type="button"` y `disabled={busy}`. El `Select` y el formulario de hogar (`!== "none"`) no se tocaron.

## Verificación
`npx tsc --noEmit --pretty false --incremental false`: solo quedan los dos errores previos
(`CongressOpsPanel.tsx:1748`, `repository.ts:259`). `ParticipantSheet.tsx` no aparece.

## Nota
En una primera corrida tsc nombró `ParticipantSheet.tsx(597)` (prop `busy` en `ReceptionStageHeader`).
No viene de este cambio: es la llamada a `ReceptionStageHeader` que otra edición en curso estaba modificando.
En la segunda corrida ya no aparece. Conviene reconfirmar tsc al cerrar.

## Commits
Ninguno.

## Restore ReceptionStageHeader + ParticipantSheet wiring
- Status: DONE
- ReceptionStageHeader.tsx rewritten (always shows progress.stageLabel; primary Button when operate is true).
- ParticipantSheet.tsx: header now receives busy + onPrimary; Formulario OK banner restored.
- npx tsc --noEmit --pretty false --incremental false: exit 2, 2 errors, both pre-existing and unrelated (CongressOpsPanel.tsx:1748, lib/congress/repository.ts:259). ParticipantSheet.tsx and ReceptionStageHeader.tsx not named.
- Note: ParticipantSheet still has its own primary Button below the scroll div (not touched per instructions), so operate mode shows two primary buttons.
