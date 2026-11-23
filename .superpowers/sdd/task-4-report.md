# Task 4 report: Asistencia en orden de fila

Status: DONE. Not committed.

## What changed (only `ParticipantSheet.tsx`)
- Imported type `ReceptionMissingField`.
- `saveIdentity` was already lifted into the component body (used by the header "Guardar"); reused it for the new "Guardar datos" button. It keeps RUT/phone validation and the same `onPatchRegistration`.
- Added `identityControl(field)` (Nombre / Teléfono / Zona / Iglesia inputs, reusing editName/editPhone/editZone/editChurch), `missingFields`, `isMissing`, `missingFieldLabels`, and `attendanceDays` (journeyDay first).
- Asistencia panel order now: day cards (journeyDay first; its Llegada button has no `size="sm"`; Ausente/Sin marcar unchanged; "se espera hoy" hint when `progress.arrivalRequired`), "Previsto: ..." plus three buttons Sábado/Domingo/Ambos (`primary` when `expectedPreset` matches, else `outline`; "unconfirmed" leaves none active) replacing the "Confirmar asistencia" Select, "Faltan datos" gate box (controls only for missing fields + Guardar datos; read-only list when `!operate`), then "Datos del inscrito" with the fields not missing, plus RUT, Correo, Eliminar, and both leader checkboxes. Historial unchanged.
- Gate box does not touch the badge button (still from `receptionPrimaryAction`). No payment lock, no lodging buttons.

## Typecheck
`npx tsc --noEmit --pretty false --incremental false`
Errors remain only in CongressOpsPanel.tsx (1748) and lib/congress/repository.ts (259), both pre-existing / out of scope. ParticipantSheet.tsx is NOT named.

## Notes
- The sheet had no literal "Guardar datos" button before (saveIdentity existed already, "Guardar" in the dialog header while editing). Added "Guardar datos" in the gate box.
- Guardar datos is disabled if name, church or zone is empty (same guard as header Guardar).
- Not visually tested in a browser.

Status: done (sin commit)
Commits: none
Test summary: see **Verificación** below.
Report path: `c:\Users\semip\Proyectos\portal-sem\.superpowers\sdd\task-4-report.md`

# Task 4 report — Título Atención · Plataforma

**Status:** DONE (sin commit)

## Alcance (plan 2026-11-18, Task 4)

En `DesktopAttention.tsx`, derivar el título de la ventana desde `channel` y `globalDesk`:

- `envivo` → `Chat en vivo`
- mesa plataforma (`globalDesk`) → `Atención · Plataforma`
- resto → `Atención`

Cabecera de empresa sin cambios: `Atención | {companyName}`.

## Cambios

- `src/components/desktop/DesktopAttention.tsx` (~línea 411):

```ts
const title =
  channel === "envivo"
    ? "Chat en vivo"
    : globalDesk
      ? "Atención · Plataforma"
      : "Atención";
```

`globalDesk` sigue siendo `channel === "mensajes" && serverDesk === "platform" && mode === "panel"`.

## Verificación

Comando: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`

- Pass: `Nuevo ticket usa Seleccionar empresa y no Elige una empresa`
- Pass: `la ventana de Plataforma se titula Atención · Plataforma`
- Pass: `Compose se remonta con composeSession`
- Fail (esperado hasta Task 5): `Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS`

**Resumen:** 3 pass / 1 fail.

## Notas

- No se hizo commit.
- Smoke en navegador: no realizado en esta tarea.
