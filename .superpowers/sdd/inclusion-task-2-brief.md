### Task 2: Contenido en `inclusion-laboral`

**Files:** `src/sites/cumple/pages/materias.ts`

- [ ] **Step 1:** Insertar opcionales (valores de assert):

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

- [ ] **Step 2:** Tests PASS.
- [ ] **Step 3:** Visual en `/materias/inclusion-laboral`.
- [ ] **Step 4:** No commit.
