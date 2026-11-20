### Task 7: Distintivo en la fila

**Files:**
- Modify: `src/components/admin/congress/reception/ReceptionView.tsx`

**Interfaces:**
- Consumes: `deriveReceptionProgress` y `journeyDay` (la vista ya lo recibe). Pagos: pasar `[]`. El texto del listado es `stageLabel`, y un `paid` sin pagos cargados no necesita el candado del líder para decir **Listo** o **En alojamiento**.

- [ ] **Step 1: Mostrar la etapa bajo el nombre**

Dentro de `ReceptionView`, un mapa memorizado:

```ts
const stageLabelById = useMemo(() => {
  const labels = new Map<string, string>();
  for (const reg of registrations) {
    labels.set(
      reg._id,
      deriveReceptionProgress({
        registrationId: reg._id,
        registration: reg,
        payments: [],
        assignments,
        journeyDay,
      }).stageLabel
    );
  }
  return labels;
}, [registrations, assignments, journeyDay]);
```

En la celda de escritorio, bajo `registrationDisplayName(reg)` y antes del teléfono:

```tsx
<p className="text-xs font-extrabold text-primary">{stageLabelById.get(reg._id)}</p>
```

En la tarjeta móvil, el mismo `<p>` bajo el nombre y antes del aviso de formulario.

- [ ] **Step 2: Verificar dominio y tipos**

Run: `npx tsx --test tests/baseline/congress-reception-stage.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ReceptionView.tsx`.

