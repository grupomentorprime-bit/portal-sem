# Congreso Varones — Fecha/hora del formulario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Recepción (tabla, móvil y ficha) mostrar la fecha/hora en que la persona envió el formulario público — altas nuevas y quienes ya ingresaron — sin confundirla con llegada, pago o alojamiento.

**Architecture:** Al `GET /api/congress/registrations` (tras el sync existente) se enriquecen las filas con `formSubmittedAt` leyendo `createdAt` de `experience_form_submissions` por `submissionId`. No se persiste en la inscripción. Helpers puros etiquetan **Formulario** / **Actualización** / vacío. La UI de Recepción y la ficha consumen ese campo; al upsert local se conserva `formSubmittedAt` si la respuesta del PATCH no lo trae.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB (`ObjectId`), admin kit, `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-18-congreso-varones-fecha-formulario-design.md`

## Global Constraints

- Fuente: `createdAt` del envío (`experience_form_submissions`), vía `submissionId`.
- No campo persistido ni migración; no usar `updatedAt` / `createdAt` de la inscripción como hora del form.
- Incluye envíos ya existentes (hora histórica).
- Mantener `syncCongressFormSubmissions` antes del listado.
- Display: `America/Santiago` con `formatDateTimeSantiago`.
- Copy: **Formulario** / **Actualización** / **—** (tabla) / **Sin formulario** (móvil y ficha).
- Sin formulario público, otras pestañas, despliegue; **sin commit/PR** salvo que el usuario lo pida (omitir pasos `git commit` / `git push`).

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/types.ts` | `formSubmittedAt?: string \| null` (enriquecimiento API; no DB) |
| `src/core/congress/form-engagement.ts` | `formSubmissionDisplay`, `withFormSubmittedAt` |
| `src/lib/congress/form-submitted-at.ts` | Cargar mapa `submissionId → createdAt` desde Mongo |
| `src/app/api/congress/registrations/route.ts` | Adjuntar `formSubmittedAt` al listado |
| `src/components/admin/congress/labels.ts` | Texto corto reutilizable si hace falta (opcional; preferir form-engagement) |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Conservar `formSubmittedAt` en `upsertRegistration` |
| `src/components/admin/congress/reception/ReceptionView.tsx` | Columna + línea móvil |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | Línea bajo el nombre |
| `tests/baseline/congress-form-submitted-at.test.ts` | Tests puros de etiqueta y merge |

---

### Task 1: Dominio puro — tipo, etiqueta y merge

**Files:**
- Modify: `src/core/congress/types.ts`
- Modify: `src/core/congress/form-engagement.ts`
- Create: `tests/baseline/congress-form-submitted-at.test.ts`

**Interfaces:**
- Produces:
  - `CongressRegistration.formSubmittedAt?: string | null`
  - `formSubmissionDisplay(reg): { label: "Formulario" \| "Actualización" \| null; at: string \| null }`
  - `withFormSubmittedAt(regs, map: ReadonlyMap<string, string>): CongressRegistration[]`

- [ ] **Step 1: Test fallido**

Crear `tests/baseline/congress-form-submitted-at.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formSubmissionDisplay,
  withFormSubmittedAt,
} from "../../src/core/congress/form-engagement";
import type { CongressRegistration } from "../../src/core/congress/types";

function base(
  partial: Partial<CongressRegistration> &
    Pick<CongressRegistration, "source">
): Pick<CongressRegistration, "source" | "submissionId" | "formSubmittedAt"> {
  return {
    source: partial.source,
    submissionId: partial.submissionId ?? null,
    formSubmittedAt: partial.formSubmittedAt ?? null,
  };
}

describe("formSubmissionDisplay", () => {
  it("Formulario cuando source=form y hay hora", () => {
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "form", formSubmittedAt: "2026-11-10T18:00:00.000Z" })
      ),
      { label: "Formulario", at: "2026-11-10T18:00:00.000Z" }
    );
  });

  it("Actualización cuando hay hora y source no es form", () => {
    assert.deepEqual(
      formSubmissionDisplay(
        base({
          source: "import",
          submissionId: "sub1",
          formSubmittedAt: "2026-11-11T12:00:00.000Z",
        })
      ),
      { label: "Actualización", at: "2026-11-11T12:00:00.000Z" }
    );
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "door", formSubmittedAt: "2026-11-11T12:00:00.000Z" })
      ),
      { label: "Actualización", at: "2026-11-11T12:00:00.000Z" }
    );
  });

  it("sin etiqueta si no hay hora", () => {
    assert.deepEqual(formSubmissionDisplay(base({ source: "import" })), {
      label: null,
      at: null,
    });
    assert.deepEqual(
      formSubmissionDisplay(
        base({ source: "form", formSubmittedAt: null })
      ),
      { label: null, at: null }
    );
  });
});

describe("withFormSubmittedAt", () => {
  it("adjunta createdAt del envío por submissionId", () => {
    const regs = [
      {
        _id: "a",
        source: "form" as const,
        submissionId: "sub-a",
      },
      {
        _id: "b",
        source: "import" as const,
        submissionId: null,
      },
      {
        _id: "c",
        source: "import" as const,
        submissionId: "missing",
      },
    ] as CongressRegistration[];
    const map = new Map([["sub-a", "2026-11-10T18:00:00.000Z"]]);
    const out = withFormSubmittedAt(regs, map);
    assert.equal(out[0].formSubmittedAt, "2026-11-10T18:00:00.000Z");
    assert.equal(out[1].formSubmittedAt, null);
    assert.equal(out[2].formSubmittedAt, null);
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

Run: `npx tsx --test tests/baseline/congress-form-submitted-at.test.ts`  
Expected: FAIL (exports ausentes)

- [ ] **Step 3: Tipo + helpers**

En `types.ts`, dentro de `CongressRegistration`, tras `submissionId`:

```ts
  /**
   * Hora del envío del formulario público (ISO).
   * Solo enriquecimiento de API al listar; no se persiste en la inscripción.
   */
  formSubmittedAt?: string | null;
```

En `form-engagement.ts`:

```ts
export function formSubmissionDisplay(
  reg: Pick<CongressRegistration, "source" | "formSubmittedAt">
): { label: "Formulario" | "Actualización" | null; at: string | null } {
  const at = reg.formSubmittedAt?.trim() ? reg.formSubmittedAt.trim() : null;
  if (!at) return { label: null, at: null };
  if (reg.source === "form") return { label: "Formulario", at };
  return { label: "Actualización", at };
}

export function withFormSubmittedAt(
  regs: CongressRegistration[],
  submittedAtBySubmissionId: ReadonlyMap<string, string>
): CongressRegistration[] {
  return regs.map((reg) => {
    const sid = reg.submissionId?.trim() || "";
    const at = sid ? submittedAtBySubmissionId.get(sid) ?? null : null;
    return { ...reg, formSubmittedAt: at };
  });
}
```

- [ ] **Step 4: Correr tests — deben pasar**

Run: `npx tsx --test tests/baseline/congress-form-submitted-at.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit** — omitir salvo pedido explícito del usuario.

---

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
