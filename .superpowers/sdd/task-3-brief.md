### Task 3: La ficha usa la etapa

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (el único `<ParticipantSheet>`)

**Interfaces:**
- Consumes: `deriveReceptionProgress`, `receptionPrimaryAction`, `ReceptionStepId`, `ReceptionStageHeader`
- Produces: prop nueva `journeyDay: CongressAttendanceDay` en `ParticipantSheet`

- [ ] **Step 1: Pasar el día de jornada**

En `Props` de `ParticipantSheet`, junto a `operate`:

```ts
journeyDay: CongressAttendanceDay;
```

Importar el tipo desde `@/core/congress/constants` (el archivo ya importa `CongressAttendanceDay`).

En `CongressOpsPanel.tsx`, dentro de `<ParticipantSheet>`:

```tsx
journeyDay={journeyDay}
```

- [ ] **Step 2: Calcular el progreso y el paso visible**

Dentro de `ParticipantSheet`, después de los `useMemo` existentes y cuando `registration` existe, calcular:

```ts
const progress = useMemo(() => {
  if (!registration) return null;
  return deriveReceptionProgress({
    registrationId: registration._id,
    registration,
    payments,
    assignments,
    journeyDay,
  });
}, [registration, payments, assignments, journeyDay]);
```

Reemplazar el estado `tab` / `setTab` por:

```ts
const [viewStep, setViewStep] = useState<ReceptionStepId>("asistencia");
const [viewForId, setViewForId] = useState<string | null>(null);
if (registration && progress && viewForId !== registration._id) {
  setViewForId(registration._id);
  setViewStep(progress.stage === "listo" ? "alojamiento" : progress.stage);
}
```

Ese ajuste corre durante el render solo cuando cambia la persona. Completar un paso no salta el contenido: el distintivo cambia y **Siguiente** pasa a habilitado.

Borrar el array `tabs` y la fila de botones que hace `setTab`. En su lugar, fuera de `div.max-h-[min(60vh,32rem)]` y antes del banner de formulario, renderizar:

```tsx
{progress ? (
  <ReceptionStageHeader
    progress={progress}
    viewStep={viewStep}
    operate={operate}
    busy={busy}
    onViewStep={setViewStep}
    onPrimary={() => {
      const action = receptionPrimaryAction(viewStep, progress.steps);
      if (!action.enabled || busy) return;
      if (action.kind === "close") {
        onClose();
        return;
      }
      setViewStep(viewStep === "asistencia" ? "alimentacion" : "alojamiento");
    }}
  />
) : null}
```

`onClose` sigue siendo el único efecto de la X del `Dialog`. No escribir etapa al cerrar.

Reemplazar cada `tab === "asistencia"`, `tab === "alimentacion"` y `tab === "alojamiento"` por `viewStep === ...`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx` ni `CongressOpsPanel.tsx`.

---

