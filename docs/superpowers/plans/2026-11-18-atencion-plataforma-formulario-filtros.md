# Atención Plataforma — formulario, filtros flotantes y título

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Plataforma, Nuevo ticket abre con «Seleccionar empresa» y limpia en cada apertura; Filtros es un panel flotante con draft + Aplicar; el título es «Atención · Plataforma». En empresa (p. ej. Mentor Capacitación) se confirma Mis tickets + empresa fija.

**Architecture:** Extraer helpers puros de filtros de mesa (`emptyDeskFilters` / `countAppliedDeskFilters`) en `help-origins.ts` para TDD. En `DesktopAttention`, separar estado aplicado vs draft, remontar Compose con `composeSession`, y pintar el panel como overlay CSS. Sin cambios de API ni de `attention-context`.

**Tech Stack:** TypeScript, React client component, CSS en `mentor-desktop.css`, tests `npx tsx --test` (baseline + lectura de fuente).

**Spec:** `docs/superpowers/specs/2026-11-18-atencion-plataforma-formulario-filtros-design.md`

## Global Constraints

- Sin commit/PR salvo que el usuario lo pida explícitamente.
- No cambiar `attentionDeskScope`, route API ni `CompanySpace` layout (solo Compose/filtros/título en panel Plataforma).
- Placeholder exacto: `Seleccionar empresa`. Título exacto en Plataforma: `Atención · Plataforma`.
- Contador del botón = filtros **aplicados**, no el draft.
- Chips Sin asignar / Sin primera respuesta siguen fuera del panel (toggle inmediato).
- Rama actual: trabajar sobre el working tree existente (ya hay cambios de Atención sin commitear).

## File map

| Path | Responsibility |
|------|----------------|
| `src/lib/desktop/help-origins.ts` | Tipo `DeskFilterFields` + `emptyDeskFilters` + `countAppliedDeskFilters` |
| `tests/baseline/help-desk.test.ts` o `desktop-attention-filters.test.ts` | Tests de conteo/vacio de filtros |
| `tests/baseline/desktop-attention-ui.test.ts` | Contrato de copy en fuente (`Seleccionar empresa`, título, Aplicar) |
| `src/components/desktop/DesktopAttention.tsx` | Draft/applied, Compose `key`, título, panel UI |
| `src/components/desktop/mentor-desktop.css` | Panel flotante + footer Aplicar/Limpiar |

---

### Task 1: Helpers de filtros de mesa

**Files:**
- Modify: `src/lib/desktop/help-origins.ts` (tras `filterDeskCases`)
- Create or Modify: `tests/baseline/desktop-attention-filters.test.ts`

**Interfaces:**
- Produces:
  - `export type DeskFilterFields = { tenantId: string; originId: string; status: string; priority: string; assigneeUserId: string }`
  - `export function emptyDeskFilters(): DeskFilterFields`
  - `export function countAppliedDeskFilters(fields: DeskFilterFields): number`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-attention-filters.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countAppliedDeskFilters,
  emptyDeskFilters,
} from "../../src/lib/desktop/help-origins";

describe("filtros de bandeja Atención (mesa)", () => {
  it("vacío cuenta 0", () => {
    assert.equal(countAppliedDeskFilters(emptyDeskFilters()), 0);
  });

  it("cuenta solo campos con valor", () => {
    assert.equal(
      countAppliedDeskFilters({
        tenantId: "mentor-prime-capacitacion",
        originId: "",
        status: "pendiente",
        priority: "",
        assigneeUserId: "u1",
      }),
      3
    );
  });

  it("emptyDeskFilters deja todos los campos en cadena vacía", () => {
    assert.deepEqual(emptyDeskFilters(), {
      tenantId: "",
      originId: "",
      status: "",
      priority: "",
      assigneeUserId: "",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: FAIL (exports missing)

- [ ] **Step 3: Write minimal implementation**

In `src/lib/desktop/help-origins.ts`, after `filterDeskCases`:

```ts
export type DeskFilterFields = {
  tenantId: string;
  originId: string;
  status: string;
  priority: string;
  assigneeUserId: string;
};

export function emptyDeskFilters(): DeskFilterFields {
  return {
    tenantId: "",
    originId: "",
    status: "",
    priority: "",
    assigneeUserId: "",
  };
}

export function countAppliedDeskFilters(fields: DeskFilterFields): number {
  return [
    fields.tenantId,
    fields.originId,
    fields.status,
    fields.priority,
    fields.assigneeUserId,
  ].filter(Boolean).length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts`  
Expected: PASS

---

### Task 2: Contrato de UI en fuente (copy y panel)

**Files:**
- Create: `tests/baseline/desktop-attention-ui.test.ts`
- Modify later in Tasks 3–4: `DesktopAttention.tsx`, `mentor-desktop.css`

**Interfaces:**
- Consumes: copy fijado en el spec
- Produces: red de seguridad para no regresar a «Elige una empresa» ni panel inline

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const src = () =>
  readFileSync(resolve(root, "src/components/desktop/DesktopAttention.tsx"), "utf8");
const css = () =>
  readFileSync(resolve(root, "src/components/desktop/mentor-desktop.css"), "utf8");

describe("Atención UI — Plataforma", () => {
  it("Nuevo ticket usa Seleccionar empresa y no Elige una empresa", () => {
    const text = src();
    assert.match(text, /Seleccionar empresa/);
    assert.doesNotMatch(text, /Elige una empresa/);
  });

  it("la ventana de Plataforma se titula Atención · Plataforma", () => {
    assert.match(src(), /Atención · Plataforma/);
  });

  it("Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS", () => {
    const text = src();
    assert.match(text, />Aplicar</);
    assert.match(text, />Limpiar</);
    assert.match(css(), /\.attn-filter-float/);
    assert.match(css(), /position:\s*absolute/);
  });

  it("Compose se remonta con composeSession", () => {
    assert.match(src(), /composeSession/);
    assert.match(src(), /key=\{composeSession\}/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`  
Expected: FAIL on missing strings / CSS class

---

### Task 3: Compose — placeholder, disable y remount

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

### Task 4: Título Atención · Plataforma

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

---

### Task 5: Filtros flotantes con draft + Aplicar

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

### Task 6: Verificación manual Owner

**Files:** none (manual)

- [ ] **Step 1: Plataforma**

En `/escritorio` con Owner, sin empresa activa:

1. Abrir Atención → título **Atención · Plataforma**.
2. Filtros cerrado; abrir, cambiar draft, **Aplicar** → panel cierra, badge N, lista filtrada, altura de lista estable.
3. **Limpiar** + **Aplicar** → badge 0.
4. Nuevo ticket → **Seleccionar empresa**; Enviar deshabilitado; completar → habilita.
5. Volver / enviar y abrir de nuevo → selector vacío otra vez.

- [ ] **Step 2: Mentor Capacitación**

Entrar al espacio Mentor Capacitación con la misma cuenta:

1. Atención muestra **Mis tickets**.
2. Nuevo ticket: empresa fija Mentor Capacitación (pill/strong, sin select).

- [ ] **Step 3: Report outcome**

Document in the session reply what was observed (pass/fail per step). Do not invent data if login/session blocks the check — say so and stop.

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Seleccionar empresa + submit gated | 2, 3 |
| Reset on reopen (composeSession) | 3 |
| Floating filters, closed default | 5 |
| Draft + Aplicar + count on button | 1, 5 |
| Limpiar draft → 0 on Aplicar | 5 |
| Título Atención · Plataforma | 4 |
| Mentor Capacitación Mis tickets + fixed company | 6 (verify existing) |
| No API/context changes | Global constraints |

No placeholders left. Helper names consistent: `emptyDeskFilters` / `countAppliedDeskFilters` / `DeskFilterFields` / `composeSession` / `attn-filter-float`.
