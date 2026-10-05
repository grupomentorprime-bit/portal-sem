# Cumple Laboral y RR.HH. editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el patrón editorial de Ley Karin / SST a `/materias/laboral-rrhh` (batón, panel, conceptos, checklist, implica, pasos).

**Architecture:** Reutilizar tipos y bloques de `MateriaPage`; solo rellenar opcionales en el contenido `laboral-rrhh` y ajustar tests que hoy excluyen laboral del set editorial.

**Tech Stack:** TypeScript, React, Cumple site, `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-02-cumple-laboral-rrhh-editorial-design.md`

## Global Constraints

- H1 = `Laboral y RR.HH.` (menú sin cambio).
- Wordmark ya presente: `mark: ["RR.HH."]`, `markTone: "hot"`.
- Hechos anclados a BCN / `norma.ts` (Código del Trabajo + Ley 21.561 vía art. 22); sin tramos de gradualidad inventados ni multas.
- Panel: etiqueta `Marco` (no inventar “vigente desde” para todo el bloque laboral); remisión a gradualidad en texto oficial.
- Sin hero oscuro, glow-btn, orbs, clon portal estatal.
- Datos, inclusión y contratistas siguen sin opcionales editoriales.
- No ampliar tipos de `MateriaContent`.

## File map

| File | Responsibility |
|------|----------------|
| `tests/baseline/cumple-pages.test.ts` | Test editorial de laboral; set “sin opcionales” = las otras 3 |
| `src/sites/cumple/pages/materias.ts` | Contenido `laboral-rrhh` (opcionales + copy) |
| `src/components/sites/cumple/icons.tsx` | Solo si falta un trazo; preferir `clipboard`, `chart`, `check` |

---

### Task 1: Test editorial Laboral (falla primero)

**Files:**
- Modify: `tests/baseline/cumple-pages.test.ts`
- Test: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `getMateria`, `materias` from `src/sites/cumple/pages/materias.ts`
- Produces: assertion contract for laboral editorial fields

- [x] **Step 1: Actualizar el set editorial en el test de SST y añadir test de laboral**

En el test `"SST / DS 44 incluye el mismo patrón editorial que Ley Karin"`, cambiar:

```ts
const editorial = new Set(["ley-karin", "seguridad-salud-trabajo"]);
```

por:

```ts
const editorial = new Set(["ley-karin", "seguridad-salud-trabajo", "laboral-rrhh"]);
```

Añadir un test nuevo inmediatamente después:

```ts
it("Laboral y RR.HH. incluye el mismo patrón editorial que Ley Karin", () => {
  const lab = getMateria("laboral-rrhh");
  assert.equal(lab?.titleName, "Laboral y RR.HH.");
  assert.deepEqual(lab?.mark, ["RR.HH."]);
  assert.equal(lab?.markTone, "hot");
  assert.ok(lab?.concepts);
  assert.equal(lab?.concepts?.items.length, 3);
  assert.ok(lab?.concepts?.items.some((item) => /reglamento/i.test(item.title)));
  assert.ok(lab?.concepts?.items.some((item) => /jornada/i.test(item.title)));
  assert.ok(lab?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    lab?.baton?.map((item) => item.label),
    ["Reglamento", "Jornada", "Evidencia"],
  );
  assert.ok(lab?.heroAside);
  assert.equal(lab?.heroAside?.heading, "Lo esencial");
  assert.match(lab?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(lab?.heroAside?.vigencia ?? "", /Código del Trabajo|21\.561/i);
  assert.equal(lab?.heroAside?.duties.length, 3);
  assert.match(lab?.heroAside?.source.url ?? "", /207436/);
  assert.ok(lab?.checklist);
  assert.ok((lab?.checklist?.items.length ?? 0) >= 3);
  assert.ok(lab?.implicaPoints);
  assert.equal(lab?.implicaPoints?.items.length, 3);
  assert.ok(lab?.processSteps);
  assert.equal(lab?.processSteps?.items.length, 4);
  assert.ok(
    lab?.sources.some((s) => /207436/.test(s.url)),
    "debe citar Código del Trabajo en Ley Chile",
  );
});
```

- [x] **Step 2: Correr el test y verificar que falla**

Run:

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

Expected: FAIL en `"Laboral y RR.HH. incluye el mismo patrón editorial..."` (falta `concepts` / `baton` / etc.).

- [x] **Step 3: Commit del test (omitido — usuario no pidió commit)**

Solo si el usuario pidió commit explícito:

```bash
git add tests/baseline/cumple-pages.test.ts
git commit -m "$(cat <<'EOF'
test: require editorial pattern for Laboral y RR.HH.

EOF
)"
```

---

### Task 2: Contenido editorial en `laboral-rrhh`

**Files:**
- Modify: `src/sites/cumple/pages/materias.ts` (entrada `slug: "laboral-rrhh"`)
- Test: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `MateriaContent` opcionales; `BCN.codigoTrabajo`
- Produces: filled `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps` on laboral

- [x] **Step 1: Insertar opcionales tras `normRef` / antes de `lead` (y afinar `lead` / `exige` / `sources` si hace falta)**

Mantener `titleName`, `mark`, `markTone`, `path`, `eyebrow`. Añadir (valores exactos a respetar en asserts):

```ts
baton: [
  { label: "Reglamento", icon: "clipboard" },
  { label: "Jornada", icon: "chart" },
  { label: "Evidencia", icon: "check" },
],
heroAside: {
  heading: "Lo esencial",
  vigenciaLabel: "Marco",
  vigencia: "Código del Trabajo · Ley 21.561",
  dutiesHeading: "Qué debe asegurar la empresa",
  duties: [
    {
      label: "Reglamento",
      detail: "Art. 153 cuando hay normalmente 10 o más trabajadores permanentes",
      icon: "clipboard",
    },
    {
      label: "Jornada",
      detail: "Tope de 40 horas semanales; gradualidad en el texto oficial",
      icon: "chart",
    },
    {
      label: "Evidencia",
      detail: "Documentos, responsables y registros que demuestren lo anterior",
      icon: "check",
    },
  ],
  source: BCN.codigoTrabajo,
  sourceLabel: "Texto oficial en Ley Chile",
},
```

`concepts`:

```ts
concepts: {
  heading: "Qué piezas ordena el marco laboral",
  items: [
    {
      title: "Reglamento interno",
      body: "El artículo 153 del Código del Trabajo obliga a confeccionar un reglamento interno de orden, higiene y seguridad a las empresas que ocupen normalmente diez o más trabajadores permanentes. Debe reflejar la realidad operativa, no solo existir como archivo.",
      icon: "clipboard",
      tone: "hot",
    },
    {
      title: "Jornada",
      body: "El artículo 22, modificado por la Ley 21.561, señala que la jornada ordinaria no excederá de cuarenta horas semanales. Las reglas de aplicación gradual están en esa ley; esta ficha no declara qué tramo rige en una fecha concreta.",
      icon: "chart",
      tone: "ink",
    },
    {
      title: "Evidencia laboral",
      body: "La organización debe poder mostrar el reglamento cuando aplica, cómo está configurada la jornada y quién responde de cada pieza. Sin registros ni responsables, el marco no se demuestra.",
      icon: "check",
      tone: "sand",
    },
  ],
},
```

`checklist`:

```ts
checklist: {
  heading: "Qué debería poder mostrar la organización",
  intro:
    "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
  items: [
    "Verificación de si alcanza el umbral de normalmente diez o más trabajadores permanentes (art. 153).",
    "Reglamento interno de orden, higiene y seguridad coherente con la operación, cuando el umbral aplica.",
    "Organización de la jornada alineada al tope de cuarenta horas semanales y al tramo de gradualidad que corresponda según la Ley 21.561 (consultar texto oficial).",
    "Responsables y registros que permitan demostrar qué se mantiene y quién responde.",
  ],
},
```

`implicaPoints` (mantener también `implica.paragraphs` para fallback/consistencia):

```ts
implicaPoints: {
  heading: "Qué implica para la empresa",
  items: [
    {
      title: "Umbral y documento",
      body: "Hay que saber si aplica el reglamento interno y mantenerlo coherente con la operación. Un texto desactualizado no responde al artículo 153.",
    },
    {
      title: "Jornada demostrable",
      body: "Configurar la jornada sin revisar el tramo aplicable de la Ley 21.561 genera riesgo. Esta página no fija el tramo vigente en una fecha concreta.",
    },
    {
      title: "Encaje con otras materias",
      body: "El orden laboral suele conectar con inclusión, Ley Karin y otras obligaciones. El alcance exacto depende de la operación de cada organización.",
    },
  ],
},
```

`processSteps`:

```ts
processSteps: {
  heading: "Cómo lo ordena Mentor Cumple",
  intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
  items: [
    {
      title: "Diagnóstico",
      body: "Contrasta el reglamento interno y la organización de la jornada con el texto oficial.",
    },
    {
      title: "Plan",
      body: "Define qué corregir primero: umbral, documento, jornada o registros.",
    },
    {
      title: "Implementación",
      body: "Actualiza documentos y prácticas, con responsables claros.",
    },
    {
      title: "Control",
      body: "Mantiene evidencia y revisiones periódicas a disposición de la organización.",
    },
  ],
},
```

Afinar `lead` si hace falta (una frase ejecutiva que mencione reglamento y jornada, sin marketing de campaña). Mantener `sources: [BCN.codigoTrabajo]` (cubre art. 153 y la nota del art. 22 / 21.561 en el refundido). No inventar URL de 21.561 si no está en `norma.ts`.

- [x] **Step 2: Correr tests**

Run:

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

Expected: PASS (21+ tests; el nuevo de laboral en verde; Karin y SST intactos).

- [x] **Step 3: Verificación visual rápida (local)**

Abrir `http://cumple.localhost:3000/materias/laboral-rrhh` y comprobar: wordmark RR.HH., batón, panel “Lo esencial”, 3 conceptos, checklist, implica, 4 pasos. Menú Información sigue con íconos (sin placas).

- [x] **Step 4: Commit (omitido — usuario no pidió commit)**

```bash
git add src/sites/cumple/pages/materias.ts tests/baseline/cumple-pages.test.ts
git commit -m "$(cat <<'EOF'
feat(cumple): editorial Laboral y RR.HH. al patrón Karin/SST

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Misma ruta / H1 Laboral y RR.HH. | Task 2 (sin cambio de path/title) |
| Wordmark RR.HH. hot | Ya existe; Task 1 assert |
| baton / heroAside / concepts / checklist / implicaPoints / processSteps | Task 2 |
| Conceptos reglamento · jornada · evidencia | Task 1 + 2 |
| Sin tramos/multas inventados | Copy Task 2 |
| Otras 3 materias sin opcionales | Task 1 set `editorial` |
| Sin ampliar tipos | Ningún cambio a `types.ts` |
| CTA / visual MateriaPage | Sin cambios de componente (ya renderiza opcionales) |

## Placeholder scan

Sin TBD/TODO. Íconos: `clipboard` / `chart` / `check` (existen). Sin pasos “similar a Task N” vacíos.
