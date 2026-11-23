### Task 5: Alimentación pagada por el líder

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx` (bloque `viewStep === "alimentacion"`)

**Interfaces:**
- Consumes: `progress.foodLock`

- [ ] **Step 1: Reemplazar el cobro cuando el líder ya pagó**

Cuando `progress.foodLock === "leader"`, no renderizar el formulario de pago, la exención ni el abono (`canPay && operate && registration.chargeAmountClp != null`). En su lugar:

```tsx
<div className="rounded-md border border-border bg-background-soft/40 px-3 py-3" role="status">
  <p className="text-base font-extrabold">Pagado por el líder</p>
  <p className="text-sm text-muted">
    Imputado {formatClp(registration.allocatedPaidClp)}
  </p>
</div>
```

Dejar visibles la etiqueta `contributionLabel` y el historial. Con `foodLock === "exempt"` o `"paid"`, la UI de alimentación queda como está hoy (exento puede restaurar; pagado individual no ofrece otro cobro si el saldo ya es 0).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: sin error nuevo en `ParticipantSheet.tsx`.

﻿### Task 5: Filtros flotantes con draft + Aplicar

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx`
- Modify: `src/components/desktop/mentor-desktop.css`

**Interfaces:**
- Consumes: `emptyDeskFilters`, `countAppliedDeskFilters`, `DeskFilterFields`
- Produces: applied fields drive `listed` / badge; draft only while panel open

- [ ] **Step 1: Replace flat filter state with applied + draft**

Import helpers. Replace individual `companyId` / `originId` / … used for listing with:

```ts
const [appliedFilters, setAppliedFilters] = useState(emptyDeskFilters);
const [draftFilters, setDraftFilters] = useState(emptyDeskFilters);
const [filtersOpen, setFiltersOpen] = useState(false);
```

```ts
const activeFilterCount = globalDesk
  ? countAppliedDeskFilters(appliedFilters)
  : countAppliedDeskFilters({
      ...appliedFilters,
      tenantId: "",
    });
```

In platform panel, always use full `countAppliedDeskFilters(appliedFilters)` when `globalDesk`; when company desk with panel filters (if still shown), exclude tenant. Spec: filters panel with empresa is only on `globalDesk`. Prefer:

```ts
const activeFilterCount = globalDesk ? countAppliedDeskFilters(appliedFilters) : 0;
```

and only render Filtros when `mode === "panel" && channel === "mensajes" && globalDesk` **or** keep current `mode === "panel"` but hide Empresa when not `globalDesk`. Match current UX: show Filtros on panel mensajes; if not globalDesk, omit Empresa from draft/applied count (tenant always "").

Wire `filterDeskCases`:

```ts
tenantId: globalDesk ? appliedFilters.tenantId : "",
originId: mode === "panel" ? appliedFilters.originId : "",
status: mode === "panel" ? appliedFilters.status : "",
priority: mode === "panel" ? appliedFilters.priority : "",
assigneeUserId: mode === "panel" ? appliedFilters.assigneeUserId : "",
```

- [ ] **Step 2: Open/close/apply/clear handlers**

```ts
function openFilters() {
  setDraftFilters(appliedFilters);
  setFiltersOpen(true);
}

function closeFilters() {
  setFiltersOpen(false);
}

function applyFilters() {
  setAppliedFilters(draftFilters);
  setFiltersOpen(false);
}

function clearDraftFilters() {
  setDraftFilters(emptyDeskFilters());
}
```

Toggle button:

```tsx
onClick={() => (filtersOpen ? closeFilters() : openFilters())}
```

- [ ] **Step 3: Render floating panel**

Wrap tools + panel so the float anchors correctly:

```tsx
<div className="attn-filter-anchor">
  {/* chips + Filtros + Nuevo ticket */}
  {filtersOpen && mode === "panel" && channel === "mensajes" ? (
    <div className="attn-filter-float" role="dialog" aria-label="Filtros">
      {/* selects bound to draftFilters / setDraftFilters */}
      {globalDesk ? (
        <label>
          Empresa
          <select
            aria-label="Empresa"
            value={draftFilters.tenantId}
            onChange={(e) =>
              setDraftFilters((d) => ({ ...d, tenantId: e.target.value }))
            }
          >
            <option value="">Todas</option>
            {companies.map((c) => (
              <option key={c.tenantId} value={c.tenantId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {/* Origen, Estado, Prioridad, Responsable → draftFilters fields */}
      <div className="attn-filter-actions">
        <button type="button" className="ghost" onClick={clearDraftFilters}>
          Limpiar
        </button>
        <button type="button" className="primary" onClick={applyFilters}>
          Aplicar
        </button>
      </div>
    </div>
  ) : null}
</div>
```

Remove the old inline `attn-filter-panel` block that sat between tools and the list (so the list no longer reflows).

- [ ] **Step 4: CSS floating panel**

In `mentor-desktop.css`, replace or extend `.attn-filter-panel` rules:

```css
.attn-filter-anchor { position: relative; flex: none; }
.attn-filter-float {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 16px;
  right: 16px;
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--nelzuri-line-soft);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}
.attn-filter-float label { display: grid; gap: 4px; font-size: 13px; font-weight: 650; color: var(--nelzuri-ink); }
.attn-filter-float select {
  width: 100%; height: 40px; padding: 0 12px;
  border: 1px solid var(--nelzuri-line-soft); border-radius: 12px;
  background: #fff; font: inherit; color: var(--nelzuri-ink);
}
.attn-filter-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
```

Keep `.attn-quick` inside `.attn-filter-anchor` so `top: 100%` anchors under the chips row. Ensure `.attn-inbox` / list does not get `margin` push from the float.

- [ ] **Step 5: Run all related tests**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-filters.test.ts tests/baseline/desktop-attention-ui.test.ts tests/baseline/attention-context.test.ts tests/baseline/desktop-attention.test.ts tests/baseline/help-desk.test.ts
```

Expected: all PASS

---

