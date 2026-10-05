# Cumple Inclusión laboral editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Aplicar el patrón editorial bandera a `/materias/inclusion-laboral`.

**Architecture:** Rellenar opcionales en `inclusion-laboral`; ajustar set editorial de tests. Sin ampliar tipos.

**Tech Stack:** TypeScript, React, Cumple, `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-03-cumple-inclusion-laboral-editorial-design.md`

## Global Constraints

- H1 = `Inclusión laboral`; mark `["INCLUSIÓN"]` sand.
- Hechos: Ley 21.015 / art. 157 bis (idNorma 1103997); sin cálculo anual ni sanciones inventadas.
- Panel: `Lo esencial` / `Marco` / `Ley 21.015`.
- Baton: Umbral · Cuota · Evidencia.
- Solo contratistas queda sin opcionales editoriales.
- No commit salvo pedido explícito.

---

### Task 1: Test editorial Inclusión (RED)

**Files:** `tests/baseline/cumple-pages.test.ts`

- [x] **Step 1:** Añadir `"inclusion-laboral"` al Set editorial. Añadir test:

```ts
it("Inclusión laboral incluye el mismo patrón editorial que Ley Karin", () => {
  const inc = getMateria("inclusion-laboral");
  assert.equal(inc?.titleName, "Inclusión laboral");
  assert.deepEqual(inc?.mark, ["INCLUSIÓN"]);
  assert.equal(inc?.markTone, "sand");
  assert.ok(inc?.concepts);
  assert.equal(inc?.concepts?.items.length, 3);
  assert.ok(inc?.concepts?.items.some((item) => /umbral/i.test(item.title)));
  assert.ok(inc?.concepts?.items.some((item) => /cuota/i.test(item.title)));
  assert.ok(inc?.concepts?.items.some((item) => /evidencia/i.test(item.title)));
  assert.deepEqual(
    inc?.baton?.map((item) => item.label),
    ["Umbral", "Cuota", "Evidencia"],
  );
  assert.ok(inc?.heroAside);
  assert.equal(inc?.heroAside?.heading, "Lo esencial");
  assert.match(inc?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(inc?.heroAside?.vigencia ?? "", /21\.015/);
  assert.equal(inc?.heroAside?.duties.length, 3);
  assert.match(inc?.heroAside?.source.url ?? "", /1103997/);
  assert.ok(inc?.checklist);
  assert.ok((inc?.checklist?.items.length ?? 0) >= 3);
  assert.ok(inc?.implicaPoints);
  assert.equal(inc?.implicaPoints?.items.length, 3);
  assert.ok(inc?.processSteps);
  assert.equal(inc?.processSteps?.items.length, 4);
  assert.ok(inc?.sources.some((s) => /1103997/.test(s.url)));
});
```

- [x] **Step 2:** `npx tsx --test tests/baseline/cumple-pages.test.ts` → FAIL en el nuevo test.
- [x] **Step 3:** No commit.

---

### Task 2: Contenido en `inclusion-laboral`

**Files:** `src/sites/cumple/pages/materias.ts`

- [x] **Step 1:** Insertar opcionales (valores de assert):

```ts
baton: [
  { label: "Umbral", icon: "users" },
  { label: "Cuota", icon: "chart" },
  { label: "Evidencia", icon: "check" },
],
heroAside: {
  heading: "Lo esencial",
  vigenciaLabel: "Marco",
  vigencia: "Ley 21.015",
  dutiesHeading: "Qué debe asegurar la empresa",
  duties: [
    { label: "Umbral", detail: "Empresas de 100 o más trabajadores", icon: "users" },
    { label: "Cuota", detail: "Al menos el 1% en las condiciones del art. 157 bis", icon: "chart" },
    { label: "Evidencia", detail: "Información de dotación que permita verificarlo", icon: "check" },
  ],
  source: BCN.ley21015,
  sourceLabel: "Texto oficial en Ley Chile",
},
concepts: {
  heading: "Qué piezas ordena el marco de inclusión",
  items: [
    {
      title: "Umbral",
      body: "El artículo 157 bis aplica a empresas de 100 o más trabajadores. La organización debe establecer si su dotación alcanza ese umbral.",
      icon: "users",
      tone: "sand",
    },
    {
      title: "Cuota",
      body: "Cuando el umbral aplica, la empresa deberá contratar o mantener contratados al menos el 1% de personas con discapacidad o asignatarias de una pensión de invalidez, en relación con el total de sus trabajadores. El detalle del cálculo anual debe consultarse en el texto oficial.",
      icon: "chart",
      tone: "ink",
    },
    {
      title: "Evidencia",
      body: "Para verificar umbral y cuota, la organización necesita información ordenada y actualizada de su dotación. Esta ficha no detalla sanciones ni el cálculo anual.",
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
    "Verificación de si la dotación alcanza 100 o más trabajadores.",
    "Conteo de personas en las condiciones del art. 157 bis frente al total.",
    "Información de dotación actualizada y ordenada.",
    "Responsables claros de mantener esa información.",
  ],
},
implicaPoints: {
  heading: "Qué implica para la empresa",
  items: [
    {
      title: "Saber si aplica",
      body: "Sin verificar el umbral de 100 trabajadores, no se puede saber si la cuota del 1% rige para la organización.",
    },
    {
      title: "Dotación demostrable",
      body: "Hay que poder mostrar cuántas personas en las condiciones de la norma se mantienen contratadas frente al total. Esta página no fija el cálculo anual ni sanciones.",
    },
    {
      title: "Encaje con laboral",
      body: "La inclusión conecta con la gestión de personas y otras obligaciones laborales. El alcance exacto depende de la operación.",
    },
  ],
},
processSteps: {
  heading: "Cómo lo ordena Mentor Cumple",
  intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
  items: [
    { title: "Diagnóstico", body: "Revisa la dotación frente a la regla del artículo 157 bis." },
    { title: "Plan", body: "Define acciones si existe una brecha." },
    { title: "Implementación", body: "Ejecuta y documenta las acciones priorizadas." },
    { title: "Control", body: "Mantiene actualizada la información de la organización." },
  ],
},
```

Mantener `sources: [BCN.ley21015, BCN.codigoTrabajo]`.

- [x] **Step 2:** Tests PASS.
- [x] **Step 3:** Visual en `/materias/inclusion-laboral`.
- [x] **Step 4:** No commit.
