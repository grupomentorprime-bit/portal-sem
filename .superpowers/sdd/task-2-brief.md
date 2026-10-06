### Task 2: Contenido editorial en `laboral-rrhh`

**Files:**
- Modify: `src/sites/cumple/pages/materias.ts` (entrada `slug: "laboral-rrhh"`)
- Test: `tests/baseline/cumple-pages.test.ts`

**Interfaces:**
- Consumes: `MateriaContent` opcionales; `BCN.codigoTrabajo`
- Produces: filled `baton`, `heroAside`, `concepts`, `checklist`, `implicaPoints`, `processSteps` on laboral

- [ ] **Step 1: Insertar opcionales tras `normRef` / antes de `lead` (y afinar `lead` / `exige` / `sources` si hace falta)**

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

- [ ] **Step 2: Correr tests**

Run:

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

Expected: PASS (21+ tests; el nuevo de laboral en verde; Karin y SST intactos).

- [ ] **Step 3: Verificación visual rápida (local)**

Abrir `http://cumple.localhost:3000/materias/laboral-rrhh` y comprobar: wordmark RR.HH., batón, panel “Lo esencial”, 3 conceptos, checklist, implica, 4 pasos. Menú Información sigue con íconos (sin placas).

- [ ] **Step 4: Commit (solo si el usuario lo pide)**

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
