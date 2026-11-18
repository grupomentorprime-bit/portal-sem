### Task 6: Copy SEM en página Ventas

**Files:**
- Modify: `src/lib/growth/labels.ts` — `growthVentasPageCopy(tenantId)`
- Modify: `src/app/admin/ventas/page.tsx` — pasar copy al client
- Modify: `src/components/admin/growth/VentasListClient.tsx` — usar props en vez de constantes fijas de título/vacíos
- Modify: `tests/baseline/sem-admision-ventas-vista.test.ts`

**Interfaces:**
- Consumes: `isSemTenant`
- Produces:

```ts
export function growthVentasPageCopy(tenantId: string): {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  noMatchTitle: string;
  noMatchDescription: string;
} {
  if (isSemTenant(tenantId)) {
    return {
      title: "Admisión",
      description: "Postulantes y próximas acciones del Espacio.",
      emptyTitle: "Aún no hay postulantes en seguimiento",
      emptyDescription:
        "Cuando lleguen consultas o postulaciones, aparecerán aquí para darles seguimiento.",
      noMatchTitle: "No encontramos postulantes",
      noMatchDescription: "Prueba con otro nombre o quita los filtros.",
    };
  }
  return {
    title: GROWTH_VENTAS_PAGE_TITLE,
    description: GROWTH_VENTAS_PAGE_DESCRIPTION,
    emptyTitle: GROWTH_VENTAS_EMPTY_TITLE,
    emptyDescription: GROWTH_VENTAS_EMPTY_DESCRIPTION,
    noMatchTitle: GROWTH_VENTAS_NO_MATCH_TITLE,
    noMatchDescription: GROWTH_VENTAS_NO_MATCH_DESCRIPTION,
  };
}
```

- [ ] **Step 1: Write the failing test**

```ts
import { growthVentasPageCopy } from "../../src/lib/growth/labels";
import { SEM_TENANT_ID, ADL_TENANT_ID } from "../../src/core/tenant/constants";

it("copy SEM usa Admisión; otros Espacios conservan Ventas", () => {
  assert.equal(growthVentasPageCopy(SEM_TENANT_ID).title, "Admisión");
  assert.equal(growthVentasPageCopy(ADL_TENANT_ID).title, "Ventas");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement + wire props**

`VentasListClient` recibe `copy: ReturnType<typeof growthVentasPageCopy>` y lo usa en header, breadcrumbs label final, EmptyState de cola/lista/kanban vacío de board.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/sem-admision-ventas-vista.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/labels.ts src/app/admin/ventas/page.tsx src/components/admin/growth/VentasListClient.tsx tests/baseline/sem-admision-ventas-vista.test.ts
git commit -m "feat(ventas): copy Admisión para Espacio SEM"
```

---
