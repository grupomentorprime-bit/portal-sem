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

