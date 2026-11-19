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

