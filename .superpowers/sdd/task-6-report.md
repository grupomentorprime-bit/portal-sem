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

# Task 6 Report: Verificación manual Owner

## Status

DONE_WITH_CONCERNS — smoke parcial; sesión actual no es mesa Plataforma Owner.

## Session observed

- URL: `http://localhost:3000/escritorio`
- Dock tipo cliente (Growth OS, Cumple, …), avatar **CP**
- Atención abrió capa empresa: cabecera **Atención | Seminario Eclesiástico Mayor**, nav **Mis tickets** / **Nuevo ticket**
- Búsqueda «Mentor» → «Nada coincide» (sin acceso a entrar a Mentor Capacitación desde este desk)

## Checklist

| Paso | Resultado |
|------|-----------|
| Plataforma título **Atención · Plataforma** | **BLOCKED** — no hay mesa Plataforma en esta sesión |
| Filtros flotantes + Aplicar + badge | **BLOCKED** — panel Filtros es de mesa Plataforma |
| Nuevo ticket «Seleccionar empresa» en Plataforma | **BLOCKED** — misma razón |
| Cancelar/enviar limpia empresa (Plataforma) | **BLOCKED** |
| En empresa: **Mis tickets** | **PASS** (SEM) |
| En empresa: empresa fija, sin select | **PASS** — `.attn-company-pill` presente; no hay `select[aria-label="Empresa del ticket"]`; Enviar deshabilitado sin descripción |
| Mentor Capacitación específicamente | **BLOCKED** — no entrable desde sesión actual |

## Code/test backup (no sustituye smoke Owner)

- `attention-context.test.ts` cubre Owner en plataforma vs empresa (incl. Mentor id)
- UI contract tests 4/4 + filters helpers 3/3 + suite relacionada 37/37

## Need from user

Abrir `/escritorio` con cuenta **Owner** en **Plataforma**, luego entrar a **Mentor Capacitación**, para completar el smoke de título/filtros/selector y el caso Mentor.
