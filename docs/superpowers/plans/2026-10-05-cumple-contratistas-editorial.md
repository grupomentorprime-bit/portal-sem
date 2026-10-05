# Cumple Contratistas editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Completar el patrón editorial en `/materias/contratistas-terceros` (última materia).

**Architecture:** Rellenar opcionales; set editorial = las 6 materias.

**Spec:** `docs/superpowers/specs/2026-10-05-cumple-contratistas-editorial-design.md`

## Global Constraints

- H1 `Contratistas y terceros`; mark `["TERCEROS"]` hot.
- Fuentes: 20.123 (254080) + 16.744; sin multas ni listas de documentos no ancladas.
- Panel `Lo esencial` / `Marco` / `Ley 20.123 · Ley 16.744`.
- Baton: Empresa principal · Faena · Control.
- No commit salvo pedido explícito.

---

### Task 1: Test editorial Contratistas (RED)

**Files:** `tests/baseline/cumple-pages.test.ts`

- [x] Añadir `"contratistas-terceros"` al Set editorial.
- [x] Añadir test:

```ts
it("Contratistas y terceros incluye el mismo patrón editorial que Ley Karin", () => {
  const c = getMateria("contratistas-terceros");
  assert.equal(c?.titleName, "Contratistas y terceros");
  assert.deepEqual(c?.mark, ["TERCEROS"]);
  assert.equal(c?.markTone, "hot");
  assert.ok(c?.concepts);
  assert.equal(c?.concepts?.items.length, 3);
  assert.ok(c?.concepts?.items.some((item) => /empresa principal/i.test(item.title)));
  assert.ok(c?.concepts?.items.some((item) => /faena/i.test(item.title)));
  assert.ok(c?.concepts?.items.some((item) => /documentos|control/i.test(item.title)));
  assert.deepEqual(
    c?.baton?.map((item) => item.label),
    ["Empresa principal", "Faena", "Control"],
  );
  assert.ok(c?.heroAside);
  assert.equal(c?.heroAside?.heading, "Lo esencial");
  assert.match(c?.heroAside?.vigenciaLabel ?? "", /marco/i);
  assert.match(c?.heroAside?.vigencia ?? "", /20\.123/);
  assert.equal(c?.heroAside?.duties.length, 3);
  assert.match(c?.heroAside?.source.url ?? "", /254080/);
  assert.ok(c?.checklist);
  assert.ok((c?.checklist?.items.length ?? 0) >= 3);
  assert.ok(c?.implicaPoints);
  assert.equal(c?.implicaPoints?.items.length, 3);
  assert.ok(c?.processSteps);
  assert.equal(c?.processSteps?.items.length, 4);
  assert.ok(c?.sources.some((s) => /254080/.test(s.url)));
  assert.ok(c?.sources.some((s) => /28650/.test(s.url)));
});
```

- [x] Run tests → FAIL on new test. No commit.

---

### Task 2: Contenido en `contratistas-terceros`

**Files:** `src/sites/cumple/pages/materias.ts`

```ts
baton: [
  { label: "Empresa principal", icon: "building" },
  { label: "Faena", icon: "shield" },
  { label: "Control", icon: "clipboard" },
],
heroAside: {
  heading: "Lo esencial",
  vigenciaLabel: "Marco",
  vigencia: "Ley 20.123 · Ley 16.744",
  dutiesHeading: "Qué debe asegurar la empresa",
  duties: [
    { label: "Contratistas", detail: "Saber quiénes operan en su obra, empresa o faena", icon: "building" },
    { label: "Protección", detail: "Medidas para proteger vida y salud, cualquiera sea la dependencia", icon: "shield" },
    { label: "Evidencia", detail: "Registros de coordinación y verificación", icon: "clipboard" },
  ],
  source: BCN.ley20123,
  sourceLabel: "Texto oficial en Ley Chile",
},
concepts: {
  heading: "Qué piezas ordena el marco de contratistas",
  items: [
    {
      title: "Empresa principal",
      body: "Sin perjuicio de las obligaciones del contratista, la empresa principal debe adoptar medidas de protección. Delegar la tarea no elimina la obligación propia.",
      icon: "building",
      tone: "hot",
    },
    {
      title: "Protección en faena",
      body: "Conforme al artículo 66 bis de la Ley 16.744, la protección alcanza a todas las personas que laboran en la obra, empresa o faena, cualquiera sea su dependencia.",
      icon: "shield",
      tone: "ink",
    },
    {
      title: "Documentos y control",
      body: "La empresa principal necesita saber qué contratistas operan, qué medidas se adoptaron y quién responde. Conviene contar con registros de coordinación y verificación. Esta ficha no fija una lista cerrada de documentos ni montos de multa.",
      icon: "clipboard",
      tone: "sand",
    },
  ],
},
checklist: {
  heading: "Qué debería poder mostrar la organización",
  intro:
    "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
  items: [
    "Identificación de contratistas y subcontratistas que operan en la faena.",
    "Medidas de protección de vida y salud definidas para quienes laboran ahí.",
    "Responsables claros de coordinación y verificación.",
    "Registros que acrediten qué se coordinó y qué se verificó.",
  ],
},
implicaPoints: {
  heading: "Qué implica para la empresa",
  items: [
    {
      title: "No basta delegar",
      body: "La empresa principal mantiene deberes propios de protección. El contratista no los elimina.",
    },
    {
      title: "Mapa de terceros",
      body: "Hay que saber quién opera en la faena y con qué medidas. Sin ese mapa, el control es débil.",
    },
    {
      title: "Encaje con SST",
      body: "La protección en faena conecta con seguridad y salud en el trabajo. El alcance exacto depende de la operación.",
    },
  ],
},
processSteps: {
  heading: "Cómo lo ordena Mentor Cumple",
  intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
  items: [
    { title: "Diagnóstico", body: "Identifica contratistas, faenas y medidas vigentes." },
    { title: "Plan", body: "Prioriza los controles y responsables." },
    { title: "Implementación", body: "Define registros de coordinación y verificación." },
    { title: "Control", body: "Mantiene la evidencia a disposición de la empresa principal." },
  ],
},
```

Mantener `sources: [BCN.ley20123, BCN.ley16744]`. Tests PASS. Visual. No commit.
