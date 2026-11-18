### Task 5: Vista `cola` por defecto + switcher

**Files:**
- Modify: `src/app/admin/ventas/page.tsx`
- Modify: `src/components/admin/growth/VentasListClient.tsx`
- Modify: `tests/baseline/sem-admision-ventas-vista.test.ts`

**Interfaces:**
- Consumes: `searchParams.vista`
- Produces: `vista: "cola" | "kanban" | "lista"`; default sin param = `"cola"`

Parse helper puro (testable):

```ts
// src/lib/growth/ventas-vista.ts
export type GrowthVentasVista = "cola" | "kanban" | "lista";

export function parseGrowthVentasVista(raw: string | undefined | null): GrowthVentasVista {
  const value = raw?.trim().toLowerCase();
  if (value === "lista") return "lista";
  if (value === "kanban") return "kanban";
  return "cola";
}
```

- [ ] **Step 1: Write the failing test**

```ts
import { parseGrowthVentasVista } from "../../src/lib/growth/ventas-vista";

it("parseGrowthVentasVista default cola", () => {
  assert.equal(parseGrowthVentasVista(undefined), "cola");
  assert.equal(parseGrowthVentasVista(""), "cola");
  assert.equal(parseGrowthVentasVista("kanban"), "kanban");
  assert.equal(parseGrowthVentasVista("lista"), "lista");
  assert.equal(parseGrowthVentasVista("COLA"), "cola");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement parse + wire page + client**

1. Crear `ventas-vista.ts`.
2. En `page.tsx`: `const vista = parseGrowthVentasVista(params.vista);` (reemplaza el ternario actual).
3. En `VentasListClient`:
   - Tipo `vista: "cola" | "kanban" | "lista"`.
   - Switcher orden: **Cola · Kanban · Lista** (icono `ListOrdered` o `ClipboardList` de lucide para Cola).
   - `pushFilters`: si `vista === "cola"` omitir query `vista` (URL limpia = default); `lista`/`kanban` setean el param.
   - Render Cola: misma fila densa que Lista (persona, etapa/`statusLabel`, `nextActionLabel`, responsable, chip de `priorityBand`), lista vertical; empty states compartidos.
   - Limpiar filtros debe volver a `/admin/ventas` (cola), no a kanban.

Fragmento switcher:

```tsx
<button type="button" aria-pressed={vista === "cola"} onClick={() => pushFilters({ vista: "cola" })}>
  Cola
</button>
<button type="button" aria-pressed={vista === "kanban"} onClick={() => pushFilters({ vista: "kanban" })}>
  Kanban
</button>
<button type="button" aria-pressed={vista === "lista"} onClick={() => pushFilters({ vista: "lista" })}>
  Lista
</button>
```

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: PASS  
Smoke manual: `/admin/ventas` sin query muestra Cola activa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/ventas-vista.ts src/app/admin/ventas/page.tsx src/components/admin/growth/VentasListClient.tsx tests/baseline/sem-admision-ventas-vista.test.ts
git commit -m "feat(ventas): vista Cola por defecto con switcher"
```

---
