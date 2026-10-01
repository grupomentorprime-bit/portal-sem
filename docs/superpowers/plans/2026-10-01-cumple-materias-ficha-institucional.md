# Cumple materias ficha institucional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir las páginas `/materias/...` de landing comercial a ficha normativa institucional: H1 = nombre de la materia, hero claro, CTA sobrio.

**Architecture:** Renombrar `h1` → `titleName`, añadir `normRef` opcional, unificar eyebrow. Rediseñar solo `MateriaPage` (hero claro + CTA final plano). Copy de secciones `exige`/`implica`/`cumple` se reutiliza.

**Tech Stack:** TypeScript, React, sitio Cumple (`MateriaContent`, `MateriaPage`), `node:test` + `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-01-cumple-materias-ficha-institucional-design.md`

## Global Constraints

- Solo `MateriaPage` + datos de las 6 materias. No rediseñar home, header, FAQ, ni apoyo.
- H1 visible = nombre de la materia; no titular marketing.
- Eyebrow fijo: `Materia · Cumplimiento`.
- Sin hero `#071a45`, sin glow, sin orbs, sin `glow-btn` en el héroe.
- Sin fotos stock, sin logos de gobierno, sin clonar DT.
- CTA canónico: `/evaluar`.
- Renombrar `h1` → `titleName` en el mismo corte; no dejar ambos campos.

## File structure

- Modify: `src/sites/cumple/pages/types.ts` — `titleName`, `normRef?`; quitar `h1`.
- Modify: `src/sites/cumple/pages/materias.ts` — datos de las 6 materias.
- Modify: `src/components/sites/cumple/MateriaPage.tsx` — hero institucional + CTA final simple.
- Modify: `tests/baseline/cumple-pages.test.ts` — aserciones del nuevo modelo y de la plantilla.

---

### Task 1: Modelo `titleName` / `normRef` y contenido de materias

**Files:**
- Modify: `src/sites/cumple/pages/types.ts`
- Modify: `src/sites/cumple/pages/materias.ts`
- Modify: `tests/baseline/cumple-pages.test.ts`
- Modify: `src/components/sites/cumple/MateriaPage.tsx` (solo referencias a `content.h1` → `content.titleName` si hace falta para compilar; el rediseño visual es Task 2)

**Interfaces:**
- Consumes: `MateriaContent` actual.
- Produces:
  ```ts
  export type MateriaContent = {
    slug: string;
    path: string;
    eyebrow: string; // siempre "Materia · Cumplimiento"
    titleName: string;
    normRef?: string;
    lead: string;
    disclaimer: string;
    exige: MateriaSection;
    implica: MateriaSection;
    cumple: MateriaSection;
    sources: OfficialSource[];
    relatedPaths: string[];
  };
  ```

- [ ] **Step 1: Write the failing test**

En `tests/baseline/cumple-pages.test.ts`, dentro de `describe("Materias Cumple")`, reemplazar `assert.match(materia.h1, /\S/)` y añadir:

```ts
it("cada materia usa titleName institucional y eyebrow transversal", () => {
  assert.equal(materias.length, 6);
  for (const materia of materias) {
    assert.equal(materia.eyebrow, "Materia · Cumplimiento");
    assert.match(materia.titleName, /\S/);
    assert.ok(!("h1" in materia), `${materia.slug}: no debe conservar h1`);
  }
  const ley = getMateria("ley-karin");
  assert.equal(ley?.titleName, "Ley Karin");
  assert.equal(ley?.normRef, "Ley 21.643");
});
```

Actualizar el test existente que usa `materia.h1` para usar `materia.titleName`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: FAIL — `titleName` / eyebrow transversal no existen.

- [ ] **Step 3: Update types and materia content**

En `types.ts`, reemplazar `h1: string` por:

```ts
  titleName: string;
  normRef?: string;
```

En `materias.ts`, para cada entrada:

| slug | titleName | normRef |
|------|-----------|---------|
| `ley-karin` | `Ley Karin` | `Ley 21.643` |
| `seguridad-salud-trabajo` | `Seguridad y salud en el trabajo` | `Ley 16.744 · Decreto 44` |
| `laboral-rrhh` | `Laboral y RR.HH.` | `Código del Trabajo` |
| `proteccion-datos` | `Protección de datos` | `Ley 19.628` |
| `inclusion-laboral` | `Inclusión laboral` | `Ley 21.015` |
| `contratistas-terceros` | `Contratistas y terceros` | `Ley 20.123` |

- `eyebrow`: `"Materia · Cumplimiento"` en las 6.
- `lead`: conservar el lead documental actual; si el antiguo `h1` marketing aporta una idea útil, incorporar **una** frase breve al lead (opcional, sin recuperar el tono de campaña como título).
- Resto de secciones sin cambios de sustancia.

En `MateriaPage.tsx`, cambiar `content.h1` → `content.titleName` y, si existe, renderizar `content.normRef` (puede quedar temporalmente en el hero oscuro hasta Task 2).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sites/cumple/pages/types.ts src/sites/cumple/pages/materias.ts src/components/sites/cumple/MateriaPage.tsx tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): use institutional titleName and normRef on materias"
```

---

### Task 2: Rediseño visual de `MateriaPage` (ficha)

**Files:**
- Modify: `src/components/sites/cumple/MateriaPage.tsx`
- Modify: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `MateriaContent` con `titleName`, `normRef?`, `lead`, secciones existentes.
- Produces: hero claro + CTA final plano; sin marketing hero.

- [ ] **Step 1: Write the failing test**

Ampliar el test de plantilla:

```ts
it("MateriaPage es ficha institucional sin hero comercial", () => {
  const materiaPage = readFileSync("src/components/sites/cumple/MateriaPage.tsx", "utf8");
  assert.match(materiaPage, /titleName/);
  assert.match(materiaPage, /normRef/);
  assert.match(materiaPage, /Materia · Cumplimiento|content\.eyebrow/);
  assert.doesNotMatch(materiaPage, /#071a45/);
  assert.doesNotMatch(materiaPage, /glow-btn/);
  assert.doesNotMatch(materiaPage, /orb-a/);
  assert.match(materiaPage, /border-cline/);
  assert.match(materiaPage, /\/evaluar/);
  assert.match(materiaPage, /SourcesBlock/);
  assert.match(materiaPage, /disclaimer/);
});
```

(Reemplazar o fusionar con el test actual `MateriaPage enlaza citas...` para no duplicar; conservar aserciones de `citation.anchor` y `relatedPaths`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts`

Expected: FAIL — aún hay `#071a45` / `glow-btn` / `orb-a`.

- [ ] **Step 3: Implement institutional MateriaPage**

Reemplazar el hero y el CTA final. Estructura objetivo:

```tsx
export function MateriaPage({ content }: { content: MateriaContent }) {
  return (
    <main>
      <section className="border-b border-cline bg-cpaper text-cink">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="max-w-3xl">
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-cviolet">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 font-cdisplay text-[2rem] font-extrabold leading-[1.1] tracking-tight text-cink sm:text-[2.75rem]">
              {content.titleName}
            </h1>
            {content.normRef ? (
              <p className="mt-3 text-sm font-semibold text-cmuted">{content.normRef}</p>
            ) : null}
            <p className="mt-4 max-w-2xl text-base leading-7 text-cmuted sm:text-lg sm:leading-8">
              {content.lead}
            </p>
            <div className="mt-6">
              <a
                href="/evaluar"
                className="inline-flex justify-center rounded-full border border-cline bg-ccard px-6 py-3.5 text-sm font-bold text-cink transition hover:border-caccent/40 hover:bg-csand"
              >
                Evaluar mi empresa →
              </a>
            </div>
          </div>
        </div>
      </section>

      <Section id="materia-exige" section={content.exige} />
      <Section id="materia-implica" section={content.implica} tinted />
      <Section id="materia-cumple" section={content.cumple} />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <p className="max-w-3xl rounded-2xl border border-cline bg-csand px-5 py-4 text-sm leading-6 text-cmuted">
          {content.disclaimer}
        </p>
        <SourcesBlock sources={content.sources} />
        {/* related nav (igual que hoy) */}
      </div>

      <section className="border-t border-cline px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-cline bg-csand px-6 py-8 sm:px-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight text-cink sm:text-3xl">
              ¿Quiere saber en qué estado se encuentra su empresa?
            </h2>
            <p className="mt-3 text-base leading-7 text-cmuted">
              Responda unas preguntas y reciba un diagnóstico preliminar de sus principales obligaciones y brechas.
            </p>
          </div>
          <a
            href="/evaluar"
            className="inline-flex shrink-0 rounded-full bg-caccent px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Evaluar mi empresa ahora →
          </a>
        </div>
      </section>
    </main>
  );
}
```

Conservar `renderParagraphs`, `Section`, `SourcesBlock` y la nav `relatedPaths` sin cambios de comportamiento. Orden del cuerpo según spec: secciones → disclaimer → fuentes → relacionado → CTA final.

Usar `bg-caccent` solo si ese token ya existe en Cumple; si no, `bg-[#2f5bff]` o la clase de botón primaria ya usada en el sitio (p. ej. la del header), **sin** `glow-btn`.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/baseline/cumple-pages.test.ts tests/baseline/cumple-site.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sites/cumple/MateriaPage.tsx tests/baseline/cumple-pages.test.ts
git commit -m "feat(cumple): restyle materia pages as institutional fiches"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| H1 = nombre materia (`titleName`) | 1 |
| `normRef` | 1 |
| Eyebrow `Materia · Cumplimiento` | 1 |
| Hero claro, sin azul/orbs/glow | 2 |
| CTA héroe secundario | 2 |
| Orden cuerpo + CTA final sobrio | 2 |
| Sin rediseñar home/apoyo | — (no tasks) |
| SEO registry sin cambio obligatorio | — (YAGNI) |

## Placeholder / consistency self-review

- `titleName` / `normRef` / eyebrow alineados entre Task 1 y Task 2.
- Tests dejan de referenciar `h1` en materias.
- `glow-btn`, `#071a45`, `orb-a` prohibidos en `MateriaPage` tras Task 2.
