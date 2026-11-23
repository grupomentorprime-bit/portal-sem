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

﻿### Task 3: Compose — placeholder, disable y remount

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx`

**Interfaces:**
- Consumes: `Compose` actual (`tenantId` inicia en `""`, `companyReady`)
- Produces: `composeSession` number; `openComposer` incrementa; `key={composeSession}` en ambos mounts de `Compose` (panel y company)

- [ ] **Step 1: Add composeSession state and bump on open**

Near other state in `DesktopAttention`:

```ts
const [composeSession, setComposeSession] = useState(0);
```

Update `openComposer`:

```ts
function openComposer() {
  setComposeSession((n) => n + 1);
  setComposing(true);
  setReceipt(null);
  setSelectedId("");
  setSelectedTenantId("");
}
```

- [ ] **Step 2: Pass key to Compose instances**

On every `<Compose ... />` in the platform frame and in `CompanySpace`:

```tsx
<Compose
  key={composeSession}
  ...
/>
```

In `CompanySpace`, accept `composeSession: number` as prop and pass `key={composeSession}` to its `Compose`.

- [ ] **Step 3: Fix placeholder copy**

In Compose select (platform, not fixed company):

```tsx
<option value="">Seleccionar empresa</option>
```

Ensure there is no `Elige una empresa` left in the file.

Confirm submit stays:

```tsx
disabled={sending || !body.trim() || !areaId || !companyReady}
```

with `companyReady = mode !== "panel" || Boolean(lockedTenantId || tenantId)`.

- [ ] **Step 4: Re-run UI test partial**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: PASS on Seleccionar empresa + composeSession; may still FAIL on título/Aplicar until Task 4–5.

---

