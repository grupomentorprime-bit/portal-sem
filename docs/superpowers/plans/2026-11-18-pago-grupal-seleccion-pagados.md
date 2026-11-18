# Pago grupal: no duplicar imputados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Pago grupal, solo permitir marcar participantes `pending`; los ya pagados (u otros no pendientes) se ven deshabilitados con etiqueta, sin abonos parciales ni cambios de API.

**Architecture:** Extraer un predicado puro `isGroupPaymentSelectable` sobre `deriveContributionStatus` en el core financiero; la UI de `CongressOpsPanel` lo usa para deshabilitar checkboxes, etiquetar filas y filtrar la selección/monto. El motor `allocatePayment` ya rechaza saldo insuficiente.

**Tech Stack:** TypeScript, Next.js client component, `node:test` vía `tsx --test`, constantes `CONGRESS_CONTRIBUTION_CLP`.

## Global Constraints

- Sin abonos por persona en grupal: siempre `CONGRESS_CONTRIBUTION_CLP` ($17.000) por seleccionado.
- Seleccionable solo si `deriveContributionStatus(reg) === "pending"`.
- `paid` → visible, checkbox disabled, etiqueta **Pagado**.
- `partial` / `needs_verification` / `no_charge` → visible, no seleccionable, etiqueta vía `contributionStatusLabel`.
- Sin cambios de API, modelo Mongo ni rutas `/api/congress/payments`.
- Spec: `docs/superpowers/specs/2026-11-18-pago-grupal-seleccion-pagados-design.md`.

## File map

| File | Responsibility |
|------|----------------|
| `src/core/congress/finance-status.ts` | Añadir `isGroupPaymentSelectable` |
| `tests/baseline/congress-reception-labels.test.ts` | Tests del predicado (junto a finance status) |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Lista grupal: disable + label; limpiar selección inválida |

---

### Task 1: Predicado `isGroupPaymentSelectable`

**Files:**
- Modify: `src/core/congress/finance-status.ts`
- Test: `tests/baseline/congress-reception-labels.test.ts`

**Interfaces:**
- Consumes: `deriveContributionStatus(reg)`
- Produces: `isGroupPaymentSelectable(reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">): boolean` — `true` solo si status === `"pending"`

- [ ] **Step 1: Write the failing test**

En `tests/baseline/congress-reception-labels.test.ts`, añadir import y bloque:

```ts
import {
  deriveContributionStatus,
  isGroupPaymentSelectable,
} from "../../src/core/congress/finance-status";

describe("group payment selectable", () => {
  const base = {
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    needsReview: false,
  };

  it("solo pending es seleccionable en pago grupal", () => {
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 0 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: 5000,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      false
    );
  });
});
```

Actualizar el import existente de `deriveContributionStatus` para incluir `isGroupPaymentSelectable` (un solo import desde ese módulo).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/congress-reception-labels.test.ts`

Expected: FAIL — `isGroupPaymentSelectable` is not exported / not a function.

- [ ] **Step 3: Write minimal implementation**

En `src/core/congress/finance-status.ts`, después de `contributionStatusHasBalance`:

```ts
/** Pago grupal: solo pendientes sin imputar (monto completo, sin abonos). */
export function isGroupPaymentSelectable(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
): boolean {
  return deriveContributionStatus(reg) === "pending";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-reception-labels.test.ts`

Expected: PASS (todos los `describe` del archivo).

- [ ] **Step 5: Commit**

```bash
git add src/core/congress/finance-status.ts tests/baseline/congress-reception-labels.test.ts
git commit -m "feat(congreso): predicado de selección para pago grupal sin duplicar."
```

---

### Task 2: UI lista grupal — deshabilitar y etiquetar

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (bloque ~527–547 y ~975–1002)

**Interfaces:**
- Consumes: `isGroupPaymentSelectable`, `deriveContributionStatus`, `contributionStatusLabel` (o `contributionLabel`)
- Produces: checkboxes disabled cuando no seleccionable; monto/preview solo sobre IDs seleccionables

- [ ] **Step 1: Ampliar imports**

En `CongressOpsPanel.tsx`:

1. Desde `@/core/congress/finance-status` importar `isGroupPaymentSelectable` y `deriveContributionStatus`.
2. Desde `@/components/admin/congress/labels` añadir `contributionStatusLabel` al import existente (`formatClp`, `formatZoneLabel`, …).

- [ ] **Step 2: Filtrar selección y monto**

Tras `groupCandidates`, asegurar que `groupSelected` no contenga no-seleccionables al calcular monto/preview. Reemplazar el cálculo actual por:

```tsx
  const groupSelectableIds = useMemo(() => {
    const set = new Set(
      groupCandidates.filter(isGroupPaymentSelectable).map((r) => r._id)
    );
    return set;
  }, [groupCandidates]);

  const groupSelectedActive = useMemo(
    () => groupSelected.filter((id) => groupSelectableIds.has(id)),
    [groupSelected, groupSelectableIds]
  );

  const groupAmount = groupSelectedActive.length * CONGRESS_CONTRIBUTION_CLP;

  const groupPreview = useMemo(() => {
    if (!groupAmount || groupSelectedActive.length === 0) return [];
    return groupSelectedActive.map((id) => ({
      registrationId: id,
      amountClp: CONGRESS_CONTRIBUTION_CLP,
    }));
  }, [groupAmount, groupSelectedActive]);
```

En el display de monto total, usar `groupSelectedActive.length` (no `groupSelected.length`) para el texto `N × …`.

- [ ] **Step 3: Render de filas con disabled + etiqueta**

Reemplazar el `map` de `groupCandidates` por:

```tsx
                {groupCandidates.map((r) => {
                  const selectable = isGroupPaymentSelectable(r);
                  const checked = selectable && groupSelected.includes(r._id);
                  const roles = registrationRoleBadges(r);
                  const status = deriveContributionStatus(r);
                  return (
                    <label
                      key={r._id}
                      className={`flex items-center gap-2 text-sm ${
                        selectable ? "" : "text-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectable}
                        onChange={() => {
                          if (!selectable) return;
                          setGroupSelected((prev) =>
                            checked
                              ? prev.filter((id) => id !== r._id)
                              : [...prev, r._id]
                          );
                        }}
                      />
                      <span>
                        {registrationDisplayName(r)}
                        {roles.length ? (
                          <span className="text-xs text-muted">
                            {" "}
                            · {roles.join(" · ")}
                          </span>
                        ) : null}
                        {!selectable ? (
                          <span className="text-xs text-muted">
                            {" "}
                            · {contributionStatusLabel(status, r)}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
```

Mantener la nota existente de efectivo + transferencia sin cambios.

- [ ] **Step 4: Sanity check TypeScript / lint del archivo tocado**

Run: `npx tsc --noEmit -p tsconfig.json`  
(o el check que use el repo si `tsc` es pesado: al menos abrir el panel y confirmar que no hay errores de import).

Expected: sin errores nuevos en `CongressOpsPanel.tsx` / `finance-status.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/congress/CongressOpsPanel.tsx
git commit -m "feat(congreso): bloquea en pago grupal a quienes ya estánaron."
```

---

### Task 3: Verificación manual (navegador)

**Files:** ninguna (solo checklist)

- [ ] **Step 1: Arrancar o usar el panel**

Abrir `/admin/portal/congreso-varones` → pestaña **Aportes y pagos** → **Pago grupal**.

- [ ] **Step 2: Casos de la spec**

1. Zona/iglesia con varios pendientes: marcar 3, guardar → un ingreso; esos 3 muestran **Pagado** y checkbox disabled.
2. Segundo ingreso con los que faltan → OK; monto `N × $17.000 = $…` en negrita.
3. Pagar uno desde ficha individual → en grupal aparece **Pagado**, no seleccionable.
4. Confirmar que la nota de efectivo/transferencia sigue visible.
5. Confirmar que no hay campo de monto editable por persona.

- [ ] **Step 3: Re-run unit tests**

Run: `npm run test:baseline -- tests/baseline/congress-reception-labels.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit vacío no requerido** — si hubo ajustes menores de copy/UI tras la prueba, commitearlos:

```bash
git add -p
git commit -m "fix(congreso): ajustes UI pago grupal tras verificación."
```

Si no hubo cambios, no crear commit vacío.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Solo monto completo $17.000 | Task 2 (preview/amount) |
| Varios ingresos grupales en el tiempo | Ya soportado; UI no bloquea segundos POSTs (Task 2+3) |
| Pagado visible + disabled + etiqueta | Task 2 |
| Individual o grupal → mismo tratamiento | `paid` vía `deriveContributionStatus` (Task 1+2) |
| Efectivo + transferencia = dos registros | Nota UI existente; Task 3 confirma |
| Sin cambio API | Ninguna task toca API |
| `partial` / verification / no_charge no seleccionables | Task 1 predicado + Task 2 |
| Monto `N × unit = total` negrita | Ya en panel; Task 2 usa `groupSelectedActive` |
