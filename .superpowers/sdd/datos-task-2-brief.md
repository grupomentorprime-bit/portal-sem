### Task 2: Contenido editorial en `proteccion-datos`

**Files:**
- Modify: `src/sites/cumple/pages/materias.ts` (entrada `slug: "proteccion-datos"`)

- [ ] **Step 1: Insertar opcionales**

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

- [ ] **Step 2: Tests PASS**

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

- [ ] **Step 3: Verificación visual** en `http://cumple.localhost:3000/materias/proteccion-datos`

- [ ] **Step 4: No commit** salvo pedido explícito

---

## Spec coverage

| Spec | Task |
|------|------|
| H1 / wordmark DATOS ink | Task 1+2 |
| baton / panel / concepts / checklist / implica / steps | Task 2 |
| Solo 19.628, sin ley posterior | Copy Task 2 |
| Inclusión y contratistas sin opcionales | Task 1 Set |
| Sin ampliar tipos | — |
