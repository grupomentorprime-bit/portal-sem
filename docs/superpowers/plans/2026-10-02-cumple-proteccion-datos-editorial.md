# Cumple Protección de datos editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el patrón editorial de Karin / SST / Laboral a `/materias/proteccion-datos` (batón, panel, conceptos, checklist, implica, pasos).

**Architecture:** Reutilizar tipos y bloques de `MateriaPage`; solo rellenar opcionales en `proteccion-datos` y ajustar el set editorial de tests.

**Tech Stack:** TypeScript, React, Cumple site, `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-02-cumple-proteccion-datos-editorial-design.md`

## Global Constraints

- H1 = `Protección de datos` (menú sin cambio).
- Wordmark ya presente: `mark: ["DATOS"]`, `markTone: "ink"`.
- Hechos anclados a BCN / `norma.ts` (Ley 19.628, idNorma 141599); sin ley posterior, sin multas ni plazos inventados.
- Panel: heading `Lo esencial`; etiqueta `Marco` / valor `Ley 19.628`.
- Sin hero oscuro, glow-btn, orbs, clon portal estatal.
- Inclusión y contratistas siguen sin opcionales editoriales.
- No ampliar tipos de `MateriaContent`.
- No commit salvo que el usuario lo pida.

## File map

| File | Responsibility |
|------|----------------|
| `tests/baseline/cumple-pages.test.ts` | Test editorial datos; set “sin opcionales” = inclusión + contratistas |
| `src/sites/cumple/pages/materias.ts` | Contenido `proteccion-datos` |
| Icons | Preferir `folder`, `list`/`clipboard`, `check` |

---

### Task 1: Test editorial Protección de datos (falla primero)

**Files:**
- Modify: `tests/baseline/cumple-pages.test.ts`

- [x] **Step 1: Ampliar set editorial y añadir test**

En el test SST (guard de no-editoriales), cambiar el Set a:

```ts
const editorial = new Set([
  "ley-karin",
  "seguridad-salud-trabajo",
  "laboral-rrhh",
  "proteccion-datos",
]);
```

Añadir test nuevo (tras el de Laboral):

```ts
it("Protección de datos incluye el mismo patrón editorial que Ley Karin", () => {
  const datos = getMateria("proteccion-datos");
  assert.equal(datos?.titleName, "Protección de datos");
  assert.deepEqual(datos?.mark, ["DATOS"]);
  assert.equal(datos?.markTone, "ink");
  assert.ok(datos?.concepts);
  assert.equal(datos?.concepts?.items.length, 3);
  assert.ok(datos?.concepts?.items.some((item) => /datos personales/i.test(item.title)));
  assert.ok(datos?.concepts?.items.some((item) => /tratamiento/i.test(item.title)));
  assert.ok(datos?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    datos?.baton?.map((item) => item.label),
    ["Datos", "Tratamiento", "Evidencia"],
  );
  assert.ok(datos?.heroAside);
  assert.equal(datos?.heroAside?.heading, "Lo esencial");
  assert.match(datos?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(datos?.heroAside?.vigencia ?? "", /19\.628/);
  assert.equal(datos?.heroAside?.duties.length, 3);
  assert.match(datos?.heroAside?.source.url ?? "", /141599/);
  assert.ok(datos?.checklist);
  assert.ok((datos?.checklist?.items.length ?? 0) >= 3);
  assert.ok(datos?.implicaPoints);
  assert.equal(datos?.implicaPoints?.items.length, 3);
  assert.ok(datos?.processSteps);
  assert.equal(datos?.processSteps?.items.length, 4);
  assert.ok(
    datos?.sources.some((s) => /141599/.test(s.url)),
    "debe citar Ley 19.628 en Ley Chile",
  );
});
```

- [x] **Step 2: Correr tests — esperar FAIL en el nuevo test**

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

- [x] **Step 3: No commit**

---

### Task 2: Contenido editorial en `proteccion-datos`

**Files:**
- Modify: `src/sites/cumple/pages/materias.ts` (entrada `slug: "proteccion-datos"`)

- [x] **Step 1: Insertar opcionales**

Mantener `titleName`, `mark`, `markTone`, `path`, `eyebrow`, `normRef`. Añadir:

```ts
baton: [
  { label: "Datos", icon: "folder" },
  { label: "Tratamiento", icon: "list" },
  { label: "Evidencia", icon: "check" },
],
heroAside: {
  heading: "Lo esencial",
  vigenciaLabel: "Marco",
  vigencia: "Ley 19.628",
  dutiesHeading: "Qué debe asegurar la empresa",
  duties: [
    {
      label: "Datos",
      detail: "Saber qué datos personales trata la organización",
      icon: "folder",
    },
    {
      label: "Tratamiento",
      detail: "Finalidad clara y quién administra el tratamiento",
      icon: "list",
    },
    {
      label: "Evidencia",
      detail: "Reglas internas y registros que demuestren el tratamiento",
      icon: "check",
    },
  ],
  source: BCN.ley19628,
  sourceLabel: "Texto oficial en Ley Chile",
},
concepts: {
  heading: "Qué piezas ordena el marco de datos",
  items: [
    {
      title: "Datos personales",
      body: "La organización debe saber qué datos de personas recoge, almacena o usa — por ejemplo de trabajadores, postulantes o clientes — porque ese inventario es la base para revisar qué exige la Ley 19.628.",
      icon: "folder",
      tone: "ink",
    },
    {
      title: "Tratamiento",
      body: "Recoger, almacenar o usar datos personales es tratamiento. Conviene definir con qué finalidad se hace y quién lo administra. El alcance exacto se lee en el texto oficial; esta ficha no describe una ley posterior ni una fecha de reemplazo.",
      icon: "list",
      tone: "sand",
    },
    {
      title: "Evidencia",
      body: "Sin reglas internas ni registros del tratamiento, resulta difícil responder consultas o reclamos. La evidencia demuestra qué se trata, para qué y quién responde.",
      icon: "check",
      tone: "hot",
    },
  ],
},
checklist: {
  heading: "Qué debería poder mostrar la organización",
  intro:
    "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
  items: [
    "Mapa de qué datos personales se tratan y de quiénes.",
    "Finalidad conocida del tratamiento y quién lo administra.",
    "Reglas internas o políticas operativas coherentes con ese tratamiento.",
    "Registros o evidencia que permitan responder consultas o reclamos.",
  ],
},
implicaPoints: {
  heading: "Qué implica para la empresa",
  items: [
    {
      title: "Mapa primero",
      body: "Sin saber qué datos personales se tratan, es difícil cumplir o responder. El inventario es el punto de partida.",
    },
    {
      title: "Tratamiento ordenado",
      body: "Finalidad y responsables claros reducen el riesgo operativo. Esta página no fija sanciones ni plazos no anclados en la ficha oficial.",
    },
    {
      title: "Encaje con otras materias",
      body: "Los datos de trabajadores y postulantes suelen conectar con laboral y otras obligaciones. El alcance exacto depende de la operación.",
    },
  ],
},
processSteps: {
  heading: "Cómo lo ordena Mentor Cumple",
  intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
  items: [
    {
      title: "Diagnóstico",
      body: "Identifica qué datos se tratan y dónde frente a lo que la Ley 19.628 describe.",
    },
    {
      title: "Plan",
      body: "Prioriza ajustes de procesos y documentos.",
    },
    {
      title: "Implementación",
      body: "Deja reglas y registros operativos.",
    },
    {
      title: "Control",
      body: "Mantiene responsables y evidencia de cómo se aplica el tratamiento.",
    },
  ],
},
```

Afinar `lead` si hace falta. Mantener `sources: [BCN.ley19628]`.

- [x] **Step 2: Tests PASS**

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

- [x] **Step 3: Verificación visual** en `http://cumple.localhost:3000/materias/proteccion-datos`

- [x] **Step 4: No commit** salvo pedido explícito

---

## Spec coverage

| Spec | Task |
|------|------|
| H1 / wordmark DATOS ink | Task 1+2 |
| baton / panel / concepts / checklist / implica / steps | Task 2 |
| Solo 19.628, sin ley posterior | Copy Task 2 |
| Inclusión y contratistas sin opcionales | Task 1 Set |
| Sin ampliar tipos | — |
