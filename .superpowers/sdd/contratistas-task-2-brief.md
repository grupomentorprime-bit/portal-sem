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
