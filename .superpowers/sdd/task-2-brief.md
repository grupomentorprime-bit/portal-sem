### Task 2: Cargar horas de envío y enriquecer GET listado

**Files:**
- Create: `src/lib/congress/form-submitted-at.ts`
- Modify: `src/app/api/congress/registrations/route.ts`

**Interfaces:**
- Consumes: `withFormSubmittedAt` (Task 1)
- Produces: `loadFormSubmittedAtBySubmissionIds(tenantId, submissionIds: string[]): Promise<Map<string, string>>`
- GET JSON: cada ítem de `items` / `registrations` incluye `formSubmittedAt: string | null`

- [ ] **Step 1: Implementar loader**

Crear `src/lib/congress/form-submitted-at.ts`:

```ts
import "server-only";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

const SUBMISSIONS = "experience_form_submissions";

/**
 * Map submissionId (string) → createdAt ISO del envío.
 * IDs inválidos o sin documento se omiten del mapa.
 */
export async function loadFormSubmittedAtBySubmissionIds(
  tenantId: string,
  submissionIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(submissionIds.map((id) => id.trim()).filter(Boolean))];
  const objectIds: ObjectId[] = [];
  const idByHex = new Map<string, string>();
  for (const id of unique) {
    try {
      const oid = new ObjectId(id);
      objectIds.push(oid);
      idByHex.set(oid.toHexString(), id);
    } catch {
      // skip non-ObjectId strings
    }
  }
  const out = new Map<string, string>();
  if (objectIds.length === 0) return out;

  const db = await getDatabase();
  const rows = await db
    .collection<{ _id: ObjectId; createdAt?: string }>(SUBMISSIONS)
    .find(
      { tenant: tenantId, _id: { $in: objectIds } },
      { projection: { createdAt: 1 } }
    )
    .toArray();

  for (const row of rows) {
    const key = idByHex.get(row._id.toHexString());
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : null;
    if (key && createdAt) out.set(key, createdAt);
  }
  return out;
}
```

- [ ] **Step 2: Enriquecer route**

En `src/app/api/congress/registrations/route.ts`, tras obtener `items`:

```ts
import { loadFormSubmittedAtBySubmissionIds } from "@/lib/congress/form-submitted-at";
import { withFormSubmittedAt } from "@/core/congress/form-engagement";

// ... sync + listCongressRegistrations como hoy ...

const submittedAtMap = await loadFormSubmittedAtBySubmissionIds(
  ctx.tenantId,
  items.map((r) => r.submissionId).filter((id): id is string => Boolean(id))
);
const enriched = withFormSubmittedAt(items, submittedAtMap);

// Usar enriched en la respuesta:
return NextResponse.json({
  ok: true,
  items: enriched,
  registrations: enriched,
  filterOptions: { zones, churches, churchesByZone },
});
```

No tocar el sync existente ni los `filterOptions`.

- [ ] **Step 3: Verificación manual rápida (dev)**

Con el panel abierto, `GET /api/congress/registrations` debe devolver `formSubmittedAt` ISO en filas con `submissionId`, y `null` en import/puerta sin envío.  
Expected: JSON con el campo; sin errores 500.

- [ ] **Step 4: Commit** — omitir salvo pedido explícito.

---

