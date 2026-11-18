### Task 3: UI Recepción + ficha + conservar al upsert

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (`upsertRegistration`)
- Modify: `src/components/admin/congress/reception/ReceptionView.tsx`
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`

**Interfaces:**
- Consumes: `formSubmissionDisplay`, `formatDateTimeSantiago`
- UI: columna **Formulario**; móvil y ficha con la misma línea de copy de la spec

- [ ] **Step 1: Conservar `formSubmittedAt` en upsert**

En `CongressOpsPanel.tsx`, reemplazar el cuerpo de `upsertRegistration`:

```ts
const upsertRegistration = (reg: CongressRegistration) => {
  setRegistrations((prev) => {
    const idx = prev.findIndex((r) => r._id === reg._id);
    if (idx < 0) return [reg, ...prev];
    const prevReg = prev[idx];
    const next = [...prev];
    next[idx] = {
      ...reg,
      formSubmittedAt:
        reg.formSubmittedAt !== undefined
          ? reg.formSubmittedAt
          : prevReg.formSubmittedAt ?? null,
    };
    return next;
  });
};
```

Así un PATCH de llegada/pago/alojamiento no borra la hora del formulario en memoria.

- [ ] **Step 2: Columna y móvil en ReceptionView**

Imports:

```ts
import { formSubmissionDisplay } from "@/core/congress/form-engagement";
import { formatDateTimeSantiago } from "@/components/admin/congress/labels";
```

En `<thead>`, entre Alojamiento y Acción:

```tsx
<th className="px-3 py-2 font-semibold">Formulario</th>
```

En cada fila desktop, antes de la celda Acción:

```tsx
<td className="px-3 py-2.5">
  {(() => {
    const form = formSubmissionDisplay(reg);
    if (!form.at || !form.label) return "—";
    return (
      <>
        <p>{formatDateTimeSantiago(form.at)}</p>
        <p className="text-xs text-muted">{form.label}</p>
      </>
    );
  })()}
</td>
```

(Preferible calcular `const form = formSubmissionDisplay(reg)` junto a `sat`/`sun` para no usar IIFE.)

En la lista móvil, bajo el nombre (dentro del botón), añadir línea:

```tsx
{(() => {
  const form = formSubmissionDisplay(reg);
  if (!form.at || !form.label) {
    return <p className="mt-0.5 text-xs text-muted">Sin formulario</p>;
  }
  return (
    <p className="mt-0.5 text-xs text-muted">
      {form.label} · {formatDateTimeSantiago(form.at)}
    </p>
  );
})()}
```

- [ ] **Step 3: Línea en ParticipantSheet**

Tras el bloque de nombre/roles (o justo antes de “Previsto:”), mostrar:

```tsx
{(() => {
  const form = formSubmissionDisplay(registration);
  if (!form.at || !form.label) {
    return <p className="text-xs text-muted">Sin formulario</p>;
  }
  return (
    <p className="text-xs text-muted">
      {form.label} · {formatDateTimeSantiago(form.at)}
    </p>
  );
})()}
```

Imports: `formSubmissionDisplay`, `formatDateTimeSantiago`.

- [ ] **Step 4: Verificar en navegador**

1. Persona `source=form` con envío: tabla **Formulario** + fecha; ficha `Formulario · …`.
2. Nómina con `submissionId` (ya ingresó): **Actualización** + hora histórica del envío.
3. Import/puerta sin envío: **—** / **Sin formulario**.
4. Registrar llegada: la hora del formulario en tabla y ficha no cambia.

- [ ] **Step 5: Re-correr tests de dominio**

Run: `npx tsx --test tests/baseline/congress-form-submitted-at.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit** — omitir salvo pedido explícito.

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Fuente = `createdAt` del envío vía `submissionId` | 2 |
| Solo en respuesta GET listado; no persistir | 1 (tipo documentado) + 2 |
| Incluye quienes ya ingresaron | 2 (sync + lookup histórico) |
| Mantener sync al listar | 2 (no se quita) |
| Etiquetas Formulario / Actualización | 1 + 3 |
| Columna tabla, móvil, ficha | 3 |
| Llegada no cambia la hora mostrada | 3 (`upsertRegistration`) |
| Sin campo persistido / sin migración | Global + 1–2 |

**Placeholders:** ninguno.  
**Tipos:** `formSubmittedAt`, `formSubmissionDisplay`, `withFormSubmittedAt`, `loadFormSubmittedAtBySubmissionIds` consistentes entre tareas.
