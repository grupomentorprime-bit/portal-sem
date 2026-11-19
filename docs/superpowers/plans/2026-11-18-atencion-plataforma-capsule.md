# Atención · Plataforma Cápsula Mac 2050 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a la mesa Atención · Plataforma una presencia de cápsula luminosa (vidrio claro) sin tocar Chat en vivo ni Atención de empresa.

**Architecture:** Se agrega un modificador exclusivo `is-platform-capsule` solo cuando `globalDesk` es true en la ventana `is-attention-panel`. Todo el look nuevo vive en CSS scoped bajo `.ajustes-window.is-platform-capsule`. El markup de bandeja/detalle se ajusta lo mínimo (clases), sin cambiar APIs ni flujos. Chat (`live-chat-sheet`) y empresa (`is-attention-company`) quedan fuera de esos selectores.

**Tech Stack:** React (Next.js client component), CSS en `mentor-desktop.css`, tests de contrato con `node:test` leyendo archivos fuente.

## Global Constraints

- Solo mesa Plataforma: `globalDesk` (`serverDesk === "platform"` + `mode === "panel"` + canal mensajes).
- No modificar estilos/comportamiento de `.live-chat-sheet` ni de `.is-attention-company`.
- Conservar buscar, chips, filtros flotantes, Nuevo ticket, assign, reply, open, correlativos.
- Tono claro/vidrio; sin purple glow; sin dark mode.
- Spec: `docs/superpowers/specs/2026-11-18-atencion-plataforma-capsule-design.md`.

## File map

| File | Responsibility |
|------|----------------|
| `src/components/desktop/DesktopAttention.tsx` | Añadir `is-platform-capsule` cuando `globalDesk`; hooks de clase mínimos en tray/escenario si hace falta |
| `src/components/desktop/mentor-desktop.css` | Estilos scoped de cápsula / tray / escenario / motion |
| `tests/baseline/desktop-attention-ui.test.ts` | Contratos: clase cápsula, CSS scoped, chat/empresa no reescritos por el mismo bloque |

---

### Task 1: Contratos UI de cápsula (TDD)

**Files:**
- Modify: `tests/baseline/desktop-attention-ui.test.ts`
- Test: `tests/baseline/desktop-attention-ui.test.ts`

**Interfaces:**
- Consumes: fuente de `DesktopAttention.tsx` y `mentor-desktop.css`
- Produces: asserts que fallan hasta Tasks 2–4

- [ ] **Step 1: Ampliar el test de contrato**

Añadir al final del `describe` en `tests/baseline/desktop-attention-ui.test.ts`:

```ts
  it("la mesa Plataforma usa is-platform-capsule y CSS scoped, sin tocar live-chat ni empresa", () => {
    const text = src();
    const styles = css();
    assert.match(text, /is-platform-capsule/);
    assert.match(text, /globalDesk/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule\s+\.attn-inbox/);
    assert.match(styles, /\.ajustes-window\.is-platform-capsule\s+\.attn-stage/);
    assert.match(styles, /@keyframes\s+attn-capsule-in/);
    assert.doesNotMatch(styles, /\.live-chat-sheet\.is-platform-capsule/);
    assert.doesNotMatch(styles, /\.is-attention-company\.is-platform-capsule/);
  });
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-ui.test.ts
```

Expected: FAIL en el nuevo `it` (falta `is-platform-capsule` / CSS scoped).

- [ ] **Step 3: Commit**

```bash
git add tests/baseline/desktop-attention-ui.test.ts
git commit -m "test(atencion): contratos UI para capsula Plataforma."
```

---

### Task 2: Modificador `is-platform-capsule` + shell de ventana

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx` (bloque `frame` ~L483–502)
- Modify: `src/components/desktop/mentor-desktop.css` (cerca de `.ajustes-window.is-attention-panel` ~L771–778)
- Test: `tests/baseline/desktop-attention-ui.test.ts`

**Interfaces:**
- Consumes: `globalDesk` ya calculado en el componente
- Produces: `className` incluye `is-platform-capsule` solo si `globalDesk && !bubble`

- [ ] **Step 1: Agregar la clase en el frame**

En `DesktopAttention.tsx`, donde se arma el `className` de la ventana (hoy):

```tsx
: `ajustes-window is-clients is-attention${liveClient ? " is-attention-client" : " is-attention-panel"}`
```

cambiar a:

```tsx
: `ajustes-window is-clients is-attention${liveClient ? " is-attention-client" : " is-attention-panel"}${globalDesk ? " is-platform-capsule" : ""}`
```

No tocar el branch `bubble ? "live-chat-sheet"`. No tocar `CompanyShell` / `is-attention-company`.

- [ ] **Step 2: Estilos de cápsula (shell + barra)**

Al final de la sección de attention panel en `mentor-desktop.css` (después de las reglas actuales de `.ajustes-window.is-attention-panel` / `.attn-window-bar`), añadir **solo** selectores scoped:

```css
@keyframes attn-capsule-in {
  from { opacity: 0; transform: translateY(10px) scale(.985); }
  to { opacity: 1; transform: none; }
}
.ajustes-window.is-platform-capsule {
  border: 1px solid rgba(255,255,255,.55);
  border-radius: 28px;
  background: rgba(248,250,252,.88);
  box-shadow: 0 28px 80px rgba(8,18,48,.28), inset 0 1px 0 rgba(255,255,255,.7);
  backdrop-filter: blur(28px) saturate(1.25);
  -webkit-backdrop-filter: blur(28px) saturate(1.25);
  overflow: hidden;
  animation: attn-capsule-in .34s cubic-bezier(.22,.9,.28,1);
}
.ajustes-window.is-platform-capsule .attn-window-bar {
  border-bottom: 1px solid rgba(15,23,42,.06);
  background: rgba(255,255,255,.55);
  padding: 16px 18px 14px 22px;
}
.ajustes-window.is-platform-capsule .attn-window-bar h2 {
  font-size: 20px;
  letter-spacing: -.03em;
}
.ajustes-window.is-platform-capsule .attn-shell {
  background: transparent;
}
.ajustes-window.is-platform-capsule .attn-shell.is-chat {
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);
  gap: 0;
}
```

No editar reglas de `.live-chat-sheet` ni `.is-attention-company` en este paso.

- [ ] **Step 3: Correr tests de UI**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-ui.test.ts
```

Expected: el test de cápsula puede seguir fallando si aún faltan `.attn-inbox` / `.attn-stage` scoped (Tasks 3–4). Si falla solo por esos dos, continuar. Si falla por falta de `is-platform-capsule` o `@keyframes`, corregir antes de seguir.

- [ ] **Step 4: Commit**

```bash
git add src/components/desktop/DesktopAttention.tsx src/components/desktop/mentor-desktop.css
git commit -m "feat(atencion): capsula de ventana solo para mesa Plataforma."
```

---

### Task 3: Tray (bandeja) scoped

**Files:**
- Modify: `src/components/desktop/mentor-desktop.css`
- Test: `tests/baseline/desktop-attention-ui.test.ts`

**Interfaces:**
- Consumes: `.ajustes-window.is-platform-capsule`
- Produces: look de bandeja Mac bajo `.attn-inbox` / filas / chips / filtros

- [ ] **Step 1: CSS del tray**

Añadir en `mentor-desktop.css` (junto al bloque de cápsula):

```css
.ajustes-window.is-platform-capsule .attn-inbox {
  border-right: 1px solid rgba(15,23,42,.06);
  background: rgba(255,255,255,.42);
}
.ajustes-window.is-platform-capsule .attn-inbox-tools {
  padding: 16px 16px 8px;
}
.ajustes-window.is-platform-capsule .attn-inbox-tools input {
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255,255,255,.78);
  box-shadow: inset 0 0 0 1px rgba(15,23,42,.06);
}
.ajustes-window.is-platform-capsule .attn-quick {
  gap: 8px;
  padding: 0 16px 12px;
}
.ajustes-window.is-platform-capsule .attn-chip {
  border: 0;
  background: rgba(255,255,255,.7);
  box-shadow: inset 0 0 0 1px rgba(15,23,42,.05);
}
.ajustes-window.is-platform-capsule .attn-chip.is-on {
  background: rgba(47,91,255,.12);
  color: var(--nelzuri-azul-profundo);
  box-shadow: none;
}
.ajustes-window.is-platform-capsule .attn-quick .attn-new {
  height: 38px;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(47,91,255,.22);
}
.ajustes-window.is-platform-capsule .attn-filter-float {
  border: 0;
  border-radius: 18px;
  background: rgba(255,255,255,.92);
  box-shadow: 0 18px 48px rgba(8,18,48,.18);
  backdrop-filter: blur(18px);
}
.ajustes-window.is-platform-capsule .attn-org-list button.is-ticket {
  margin: 0 8px;
  border-radius: 16px;
  padding: 12px 14px;
  transition: background .18s ease, transform .18s ease;
}
.ajustes-window.is-platform-capsule .attn-org-list button.is-ticket:hover {
  background: rgba(47,91,255,.06);
}
.ajustes-window.is-platform-capsule .attn-org-list button.is-ticket.is-active {
  background: rgba(47,91,255,.1);
  transform: translateX(2px);
}
.ajustes-window.is-platform-capsule .attn-row-code {
  color: rgba(15,23,42,.45);
  font-size: 12px;
}
.ajustes-window.is-platform-capsule .attn-row-subject {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -.015em;
}
```

- [ ] **Step 2: Correr tests**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-ui.test.ts
```

Expected: el assert de `.attn-inbox` scoped debe pasar; `.attn-stage` puede seguir fallando hasta Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/desktop/mentor-desktop.css
git commit -m "feat(atencion): tray luminoso scoped a capsula Plataforma."
```

---

### Task 4: Escenario (detalle) + vacío + compose de mesa

**Files:**
- Modify: `src/components/desktop/mentor-desktop.css`
- Test: `tests/baseline/desktop-attention-ui.test.ts`

**Interfaces:**
- Consumes: `.ajustes-window.is-platform-capsule`
- Produces: escenario, tabs, composer, empty state con look de cápsula

- [ ] **Step 1: CSS del escenario**

Añadir:

```css
.ajustes-window.is-platform-capsule .attn-stage {
  background: rgba(255,255,255,.55);
}
.ajustes-window.is-platform-capsule .attn-stage-empty {
  gap: 10px;
  color: rgba(15,23,42,.45);
}
.ajustes-window.is-platform-capsule .attn-stage-empty::before {
  content: "";
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: rgba(47,91,255,.08);
}
.ajustes-window.is-platform-capsule .attn-stage-head {
  border-bottom: 1px solid rgba(15,23,42,.06);
  background: rgba(255,255,255,.4);
  padding: 18px 22px 14px;
}
.ajustes-window.is-platform-capsule .attn-stage-head h3 {
  font-size: 22px;
  letter-spacing: -.03em;
}
.ajustes-window.is-platform-capsule .attn-stage-actions {
  gap: 10px;
}
.ajustes-window.is-platform-capsule .attn-stage-tabs {
  border-bottom: 0;
  padding: 12px 18px 0;
  gap: 6px;
}
.ajustes-window.is-platform-capsule .attn-stage-tabs button {
  border-radius: 999px;
  background: rgba(255,255,255,.55);
  padding: 8px 14px;
  box-shadow: inset 0 0 0 1px rgba(15,23,42,.05);
}
.ajustes-window.is-platform-capsule .attn-stage-tabs button.is-on {
  color: var(--nelzuri-azul-profundo);
  background: rgba(47,91,255,.12);
  box-shadow: none;
}
.ajustes-window.is-platform-capsule .attn-log {
  gap: 12px;
  padding: 16px 22px;
}
.ajustes-window.is-platform-capsule .attn-log li > div {
  border: 0;
  border-radius: 18px;
  box-shadow: 0 1px 0 rgba(15,23,42,.04);
}
.ajustes-window.is-platform-capsule .attn-composer,
.ajustes-window.is-platform-capsule .attn-reply-bar {
  border-top: 1px solid rgba(15,23,42,.06);
  background: rgba(255,255,255,.62);
  backdrop-filter: blur(16px);
}
.ajustes-window.is-platform-capsule .attn-compose {
  background: transparent;
}
.ajustes-window.is-platform-capsule .attn-compose-head,
.ajustes-window.is-platform-capsule .attn-compose-fields,
.ajustes-window.is-platform-capsule .attn-compose-foot {
  background: transparent;
}
.ajustes-window.is-platform-capsule .attn-compose-foot {
  border-top: 1px solid rgba(15,23,42,.06);
}
```

- [ ] **Step 2: Correr suite de Atención UI + help-desk smoke**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-ui.test.ts tests/baseline/help-desk.test.ts
```

Expected: PASS (todos verdes). El test de cápsula debe pasar completo.

- [ ] **Step 3: Verificación manual rápida (checklist)**

En `http://localhost:3000/escritorio`:

1. Abrir **Atención** (mesa plataforma) → se ve cápsula clara, no sheet de chat.
2. Abrir **Chat en vivo** → se ve **igual que antes** (sin cápsula).
3. Si hay espacio empresa, Abrir Atención de empresa → **igual que antes**.
4. En mesa: chips, filtros, nuevo ticket, abrir caso, responder.

- [ ] **Step 4: Commit**

```bash
git add src/components/desktop/mentor-desktop.css
git commit -m "feat(atencion): escenario y compose scoped a capsula Plataforma."
```

---

### Task 5: Cierre — spec status + guardas

**Files:**
- Modify: `docs/superpowers/specs/2026-11-18-atencion-plataforma-capsule-design.md` (estado)
- Modify: `tests/baseline/desktop-attention-ui.test.ts` (si hace falta un assert extra de no-regresión)
- Test: `tests/baseline/desktop-attention-ui.test.ts`

**Interfaces:**
- Consumes: implementación Tasks 1–4
- Produces: spec marcada implementada; suite verde

- [ ] **Step 1: Actualizar estado del spec**

En el header del spec, cambiar:

```md
**Estado:** diseño aprobado en chat; pendiente revisión del archivo
```

por:

```md
**Estado:** implementado (cápsula Plataforma); Chat en vivo y empresa fuera de alcance
```

- [ ] **Step 2: Correr tests finales**

Run:

```bash
npx tsx --test tests/baseline/desktop-attention-ui.test.ts tests/baseline/desktop-attention-filters.test.ts tests/baseline/help-desk.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-11-18-atencion-plataforma-capsule-design.md tests/baseline/desktop-attention-ui.test.ts
git commit -m "docs(atencion): marcar capsula Plataforma como implementada."
```

---

## Self-review (plan vs spec)

| Spec section | Task |
|--------------|------|
| 1 Cápsula de ventana | Task 2 |
| 2 Tray | Task 3 |
| 3 Escenario | Task 4 |
| 4 Separación superficies | Tasks 1–2 (`is-platform-capsule` + asserts negativos) |
| 5 Motion | Task 2 (`attn-capsule-in`) + Task 3 (fila active) |
| 6 Criterios de éxito | Tasks 1, 4 checklist, 5 |
| 7 Fuera de alcance | Constraints + asserts `doesNotMatch` |

Placeholders: ninguno. Tipos/clases: `is-platform-capsule` consistente en tests y CSS.
