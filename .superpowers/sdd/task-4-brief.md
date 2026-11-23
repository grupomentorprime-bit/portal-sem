### Task 4: Asistencia en orden de fila

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (el bloque `viewStep === "asistencia"`)

**Interfaces:**
- Consumes: `progress.missingFields`, `progress.arrivalRequired`, `journeyDay`

- [ ] **Step 1: Subir llegada y caso de días**

Al inicio del contenido de asistencia, antes de "Datos del inscrito", dejar este orden:

1. Tarjeta del `journeyDay` primero. En el `.map` de `saturday` / `sunday`, ordenar con el día de jornada al inicio:

```ts
const attendanceDays = (
  journeyDay === "sunday" ? (["sunday", "saturday"] as const) : (["saturday", "sunday"] as const)
);
```

El botón **Llegada** del día de jornada usa el `Button` sin `size="sm"`. **Ausente** y **Sin marcar** siguen `size="sm"` `variant="outline"` y `variant="ghost"`, con los mismos `onPatchAttendance` de hoy.

2. Caso de días, tres botones, en lugar del `Select` "Confirmar asistencia". Conservar el texto "Previsto: …". Cada botón llama el mismo `onPatchRegistration` que el select:

```tsx
<div className="flex flex-wrap gap-2">
  {(
    [
      ["saturday", "Sábado", { saturday: true, sunday: false }],
      ["sunday", "Domingo", { saturday: false, sunday: true }],
      ["both", "Ambos", { saturday: true, sunday: true }],
    ] as const
  ).map(([id, label, expectedDays]) => (
    <Button
      key={id}
      type="button"
      size="sm"
      variant={expectedPreset === id ? "primary" : "outline"}
      disabled={busy || !operate}
      onClick={() => {
        setExpectedPreset(id);
        void onPatchRegistration(registration._id, { expectedDays });
      }}
    >
      {label}
    </Button>
  ))}
</div>
```

﻿### Task 4: Título Atención · Plataforma

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx` (~línea del `title`)

- [ ] **Step 1: Derive title from channel + desk**

Replace:

```ts
const title = channel === "envivo" ? "Chat en vivo" : "Atención";
```

with:

```ts
const title =
  channel === "envivo"
    ? "Chat en vivo"
    : globalDesk
      ? "Atención · Plataforma"
      : "Atención";
```

Note: `globalDesk` already means `channel === "mensajes" && serverDesk === "platform" && mode === "panel"`. Keep company header unchanged (`Atención | {companyName}`).

- [ ] **Step 2: Run UI test for title**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: title assertion PASS

Quitar el `Select` de "Confirmar asistencia". El preset `unconfirmed` no tiene botón: si `expectedPreset === "unconfirmed"`, ninguno se ve activo.

- [ ] **Step 2: Pedir solo los datos que faltan**

Extraer el `onClick` actual de **Guardar datos** a una función `saveIdentity` en el cuerpo del componente. Si `registration` es null, salir. La función conserva la validación de RUT y teléfono y el mismo `onPatchRegistration`.

Si `progress.missingFields` tiene elementos, mostrar arriba del formulario una caja "Faltan datos" con un control por campo faltante, reusando `editName`, `editPhone`, `editZone`, `editChurch` y `saveIdentity`. Esos campos no se repiten en la grilla de abajo.

La grilla de abajo muestra los datos que ya están (los que no están en `missingFields`) más RUT, correo y los dos checkboxes de líder. Esos no bloquean el botón del distintivo: el habilitado sale de `receptionPrimaryAction`, no de esta caja.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

---

